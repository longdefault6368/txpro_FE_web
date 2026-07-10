import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

// Cache database connection in development to prevent connection pooling limits
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

const MONGODB_URI = "mongodb+srv://datthanh1131_db_user:snw0EiDbHI9xdy3I@local.kfcuelc.mongodb.net/txepro?retryWrites=true&w=majority";

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("txepro");
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json({ error: "Mã vận đơn là bắt buộc" }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Query order collection by orderCode (case-insensitive)
    const order = await db.collection("orders").findOne({
      orderCode: { $regex: new RegExp(`^${code}$`, "i") },
    });

    if (!order) {
      return NextResponse.json({ error: "Không tìm thấy đơn hàng tương ứng với mã vận đơn này" }, { status: 404 });
    }

    // Resolve driver info if driverId or selectedDriverId exists
    let driver = null;
    const targetDriverId = order.driverId || order.selectedDriverId;
    if (targetDriverId) {
      const driverDoc = await db.collection("users").findOne({
        _id: new ObjectId(targetDriverId),
      });
      if (driverDoc) {
        // Find driver's vehicle details if any
        let vehicleText = null;
        let plateNumber = null;
        if (order.driverPostId) {
          const driverPost = await db.collection("driverposts").findOne({
            _id: new ObjectId(order.driverPostId)
          });
          if (driverPost && driverPost.vehicleId) {
            const vehicle = await db.collection("vehicles").findOne({
              _id: new ObjectId(driverPost.vehicleId)
            });
            if (vehicle) {
              plateNumber = vehicle.plateNumber || null;
              vehicleText = [
                vehicle.vehicleTypeChild || vehicle.vehicleTypeParent || vehicle.type || null,
                vehicle.plateNumber || null
              ].filter(Boolean).join(" - ");
            }
          }
        }

        driver = {
          fullName: driverDoc.name || "Tài xế TXEPRO",
          phone: driverDoc.phone || "",
          avatar: driverDoc.avatar || driverDoc.portraitImage || null,
          vehicleText,
          plateNumber,
        };
      }
    }

    // Fetch latest tracking points
    const trackingPoints = await db.collection("trackingpoints")
      .find({ orderId: order._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const latestLocation = trackingPoints.length > 0 
      ? {
          lat: trackingPoints[0].lat,
          lng: trackingPoints[0].lng,
          speed: trackingPoints[0].speed,
          heading: trackingPoints[0].heading,
          createdAt: trackingPoints[0].createdAt,
        }
      : null;

    // Map order fields for client presentation
    const responseData = {
      order: {
        id: String(order._id),
        orderCode: order.orderCode,
        status: order.status,
        cargoType: order.cargoType || "Hàng hóa chung",
        pickup: {
          address: order.pickup?.address || "",
          lat: order.pickup?.lat || null,
          lng: order.pickup?.lng || null,
        },
        dropoff: {
          address: order.dropoff?.address || "",
          lat: order.dropoff?.lat || null,
          lng: order.dropoff?.lng || null,
        },
        route: {
          distanceMeters: order.route?.distanceMeters || null,
          durationSeconds: order.route?.durationSeconds || null,
          polyline: order.route?.polyline || null,
        },
        offerPrice: order.offerPrice || order.budget?.max || 0,
        createdAt: order.createdAt,
      },
      driver,
      latestLocation,
      historyLocations: trackingPoints.map((p: any) => ({ lat: p.lat, lng: p.lng })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Tracking API error:", error);
    return NextResponse.json({ error: "Lỗi kết nối máy chủ dữ liệu" }, { status: 500 });
  }
}
