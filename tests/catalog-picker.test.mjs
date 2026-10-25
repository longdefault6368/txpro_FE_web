import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { catalogSeedItems } from "../../../BE/txepro-backend/server/src/data/catalogSeed.js";
const root = resolve(import.meta.dirname, ".."), require = createRequire(import.meta.url);
function loader(overrides = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const js = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    function localRequire(id) {
      if (Object.hasOwn(overrides, id)) return overrides[id];
      if (id === "@/context/LanguageContext") return { useLanguage: () => ({ language: "vi" }) };
      if (id === "next/image") return ({ sizes, ...props }) => React.createElement("img", props);
      if (id.endsWith(".module.css")) return new Proxy({}, { get: (_, key) => key === "__esModule" ? false : String(key) });
      if (id.startsWith(".") || id.startsWith("@/")) {
        const path = id.startsWith("@/") ? resolve(root, "src", id.slice(2)) : resolve(dirname(file), id);
        return load(path + (existsSync(path + ".tsx") ? ".tsx" : ".ts"));
      }
      return require(id);
    }
    vm.runInNewContext("(function(require,module,exports){" + js + "\n})", { URLSearchParams }, { filename: file })(localRequire, module, module.exports);
    return module.exports;
  }
  return name => load(resolve(root, name));
}
const load = loader(), catalog = load("src/utils/catalog-presentation.ts"), contract = load("src/utils/posting-contract.ts");
const names = type => catalogSeedItems.filter(item => item.type === type && !item.parentKey).map(item => item.name);
const options = {
  vehicleTypes: names("vehicle"), cargoTypes: names("cargo"),
  seatTypes: catalogSeedItems.filter(item => item.type === "seat").map(item => item.name),
  containerTypes: catalogSeedItems.filter(item => item.type === "container").map(item => item.name),
  constructionVehicleTypes: catalogSeedItems.filter(item => item.type === "construction").map(item => item.name),
  weightRanges: names("weight"), weightVehicleTypes: catalogSeedItems.filter(item => item.flags.weightVehicle).map(item => item.name),
};
const pickup = { address: "Điểm nhận", lat: 10.7, lng: 106.7 }, dropoff = { address: "Điểm trả", lat: 10.9, lng: 106.9 };
const payload = selection => contract.buildShipperPosting({ ...selection, pickup, dropoff, cargo: options.cargoTypes[0], time: "", notes: "", images: [] }, options);

test("API variants are grouped in Flutter order with only car, truck and container children", () => {
  const groups = catalog.vehicleChoices(options, "vi");
  assert.deepEqual(Array.from(groups, value => value.id), ["motorcycle", "car", "truck", "refrigerated", "container", "crane", "rescue", "construction", "carrier", "van", "ambulance", "livestock", "tanker"]);
  assert.equal(groups.filter(item => item.id === "truck").length, 1);
  assert.equal(groups.filter(item => item.id === "crane").length, 1);
  assert.deepEqual(Array.from(groups.filter(item => catalog.hasVehicleChildren(item.id)), item => item.id), ["car", "truck", "container"]);
  assert.equal(contract.vehicleGroup("xe container lồng (chở ô tô)"), "carrier");
  assert.equal(contract.vehicleGroup("xe tải đông lạnh"), "refrigerated");
  assert.equal(contract.vehicleGroup("xe van / ô tô bán tải"), "van");
});
test("truck choices preserve all four Flutter intervals without forcing a truck body", () => {
  const children = catalog.vehicleChildren("truck", options, "vi");
  assert.deepEqual(Array.from(children, item => item.selection.weightLabel), ["dưới 1 tấn", "1 - 5 tấn", "5 - 10 tấn", "10 - 40 tấn"]);
  for (const item of children) {
    assert.equal(catalog.validVehicleSelection(item.selection, options), true);
    const result = payload(item.selection);
    assert.equal(result.vehicleType, "xe tải");
    assert.equal(result.weightLabel, item.selection.weightLabel);
    assert.equal(result.cargoType, options.cargoTypes[0]);
    assert.ok(result.weight > 0);
  }
  assert.equal(catalog.validVehicleSelection({ vehicleType: "xe tải", child: "", weightLabel: "" }, options), false);
  assert.equal(catalog.validVehicleSelection({ ...children[0].selection, weightLabel: "100 tấn" }, options), false);
  assert.equal(contract.allowedShipperVehicle("xe tải", { ...options, vehicleTypes: ["xe máy"] }), false);
});
test("container variants resolve to three families, never to a car carrier", () => {
  const children = catalog.vehicleChildren("container", options, "vi");
  assert.deepEqual(Array.from(children, item => item.selection.child), ["xe container", "xe container lạnh (reefer)", "xe container moóc sàn"]);
  for (const item of children) {
    const result = payload(item.selection);
    assert.equal(result.vehicleType, "container / xe đầu kéo");
    assert.equal(result.vehicleTypeChild, item.selection.child);
    assert.equal(result.weight, 0);
    assert.equal(catalog.validVehicleSelection(item.selection, options), true);
  }
  assert.equal(catalog.containerFamily("xe container lồng (chở ô tô)"), null);
  assert.equal(catalog.containerFamily("unknown"), null);
  const carrierOnly = { ...options, containerTypes: ["xe container lồng (chở ô tô)"] };
  assert.equal(catalog.vehicleChildren("container", carrierOnly, "vi").length, 0);
  const movedCarrier = { ...carrierOnly, vehicleTypes: ["container / xe đầu kéo"] };
  const selection = catalog.selectionForGroup("carrier", movedCarrier);
  assert.equal(contract.allowedShipperVehicle(selection.vehicleType, movedCarrier), true);
});
test("car cards show seat counts without changing stored catalog values", () => {
  const children = catalog.vehicleChildren("car", options, "vi");
  assert.equal(children[0].title, "4 chỗ");
  assert.equal(children[0].selection.child, "4 ghế");
  assert.equal(payload(children[1].selection).seats, 7);
  assert.equal(payload(children[1].selection).cargoType, "");
  assert.equal(catalog.validVehicleSelection({ vehicleType: "ô tô", child: "999 ghế", weightLabel: "" }, options), false);
});
test("cargo has matching illustrations and translations while retaining exact API identifiers", () => {
  assert.equal(options.cargoTypes.length, 9);
  const images = new Set();
  for (const raw of options.cargoTypes) for (const language of ["vi", "en", "zh"]) {
    const choice = catalog.cargoChoice(raw, language);
    assert.equal(choice.id, raw);
    assert.ok(!choice.image.endsWith("_general.webp"));
    assert.ok(choice.title);
    images.add(choice.image);
  }
  assert.equal(images.size, 9);
  assert.equal(catalog.cargoChoice("Loại mới từ admin", "en").id, "Loại mới từ admin");
  assert.ok(catalog.cargoChoice("Loại mới từ admin", "en").image.endsWith("_general.webp"));
});
test("all bundled catalog images are web-sized copies of the Flutter artwork", () => {
  const choices = [...catalog.vehicleChoices(options, "vi"), ...["car", "truck", "container"].flatMap(id => catalog.vehicleChildren(id, options, "vi")), ...options.cargoTypes.map(value => catalog.cargoChoice(value, "vi"))];
  for (const choice of choices) {
    const file = resolve(root, "public" + choice.image);
    assert.ok(existsSync(file), choice.image);
    assert.ok(statSync(file).size < 200000, "Image should not ship the multi-megabyte original: " + choice.image);
    assert.ok(existsSync(resolve(root, "../txpro_FE/assets/images", choice.image.split("/").at(-1).replace(".webp", ".png"))));
  }
});
test("homepage drafts preserve grouped subtype, cargo and weight into the full form", () => {
  const drafts = load("src/utils/home-posting-draft.ts"), data = new Map();
  const storage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
  const selection = catalog.vehicleChildren("truck", options, "vi")[1].selection;
  drafts.saveHomePostingDraft(storage, { role: "chu-hang", ...selection, pickup, dropoff, cargo: options.cargoTypes[0], scheduled: false, from: "", to: "", price: "" });
  const restored = drafts.takeHomePostingDraft(storage, "chu-hang", "?from=home");
  assert.equal(catalog.validVehicleSelection(restored, options), true);
  assert.equal(restored.cargo, options.cargoTypes[0]);
  assert.equal(payload(restored).weightLabel, "1 - 5 tấn");
});
function harness(component, initialProps) {
  const states = []; let cursor = 0, tree, props = initialProps;
  const react = { ...React, useState(initial) { const id = cursor++; if (!(id in states)) states[id] = initial; return [states[id], next => { states[id] = typeof next === "function" ? next(states[id]) : next; }]; } };
  const View = loader({ react })("src/components/posting/CatalogPicker.tsx")[component];
  function render(next = props) { props = next; cursor = 0; tree = View(props); }
  function nodes(value = tree) { return !value || typeof value !== "object" ? [] : [value, ...React.Children.toArray(value.props?.children).flatMap(nodes)]; }
  render();
  return { render, nodes, open() { nodes().find(node => node.props?.["aria-haspopup"] === "dialog").props.onClick(); render(); },
    choices() { return nodes().filter(node => node.props?.choice); }, dialog() { return nodes().find(node => node.props?.onClose); } };
}
test("picker opens at selected subtype, supports back and cancel without changing the selection", () => {
  const selection = catalog.vehicleChildren("truck", options, "vi")[1].selection, changed = [];
  const fixture = harness("VehicleCatalogField", { options, value: selection, onChange: value => changed.push(value) });
  fixture.open();
  assert.equal(fixture.choices().length, 4);
  assert.equal(fixture.choices().filter(node => node.props.selected).length, 1);
  fixture.dialog().props.onBack(); fixture.render();
  assert.equal(fixture.choices().length, 13);
  fixture.dialog().props.onClose(); fixture.render();
  assert.equal(changed.length, 0);
  fixture.open();
  fixture.choices()[2].props.onClick(); fixture.render();
  assert.equal(changed[0].weightLabel, "5 - 10 tấn");
  assert.equal(fixture.dialog(), undefined);
});
test("cargo picker commits one exact category and driver picker keeps separate registered IDs", () => {
  const changed = [];
  const cargo = harness("CargoCatalogField", { options, value: options.cargoTypes[0], onChange: value => changed.push(value) });
  cargo.open();
  assert.equal(cargo.choices().filter(node => node.props.selected).length, 1);
  cargo.choices()[2].props.onClick();
  assert.equal(changed[0], options.cargoTypes[2]);
  const vehicles = [{ id: "a", type: "xe tải thùng kín", plateNumber: "TEST-A" }, { id: "b", type: "xe tải thùng kín", plateNumber: "TEST-B" }];
  const driver = harness("RegisteredVehicleField", { vehicles, value: "a", onChange: value => changed.push(value) });
  driver.open();
  assert.equal(driver.choices().filter(node => node.props.selected).length, 1);
  driver.choices()[1].props.onClick();
  assert.equal(changed[1], "b");
});
test("picker fields render localized selected labels and shared lightweight images", () => {
  for (const language of ["vi", "en", "zh"]) {
    const View = loader({ "@/context/LanguageContext": { useLanguage: () => ({ language }) } })("src/components/posting/CatalogPicker.tsx");
    const selection = catalog.vehicleChildren("truck", options, language)[1].selection;
    const html = renderToStaticMarkup(React.createElement(View.VehicleCatalogField, { options, value: selection, onChange() {} }));
    assert.ok(html.includes('aria-haspopup="dialog"'));
    assert.ok(html.includes("vehicle_picker_truck.webp"));
    assert.ok(html.includes(catalog.selectionDisplay(selection, options, language).title));
  }
});
