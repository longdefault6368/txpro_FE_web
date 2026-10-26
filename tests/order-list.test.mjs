import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const code = ts.transpileModule(await readFile(new URL('../src/utils/order-list.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { orderListEndpoint, orderListAction } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
test('all loads a globally paginated personal list per role instead of concatenating first pages', () => {
 assert.equal(orderListEndpoint('chu-hang', 'all', 2), '/chu-hang/orders?paginated=true&limit=20&page=2');
 assert.equal(orderListEndpoint('tai-xe', 'all', 1), '/tai-xe/orders/all?paginated=true&limit=20&page=1');
 assert.match(orderListEndpoint('chu-hang', 'in-progress', 1), /includeAwaitingIncidentResponse=true/);
 assert.throws(() => orderListEndpoint('admin', 'all', 1));
 assert.throws(() => orderListEndpoint('chu-hang', 'posts', 1));
});
test('all-tab actions are identical to state tabs, and posts never become fake tracking links', () => {
 for (const status of ['searching_driver', 'waiting_driver']) assert.deepEqual(orderListAction('chu-hang', { id: 'order-id', status }, false), { label: 'Tìm xe', href: '/chu-hang/form-tao-don?order=order-id' });
 for (const status of ['accepted', 'completed', 'disputed']) assert.deepEqual(orderListAction('chu-hang', { orderCode: 'ORD-TEST', status }, false), { label: 'Theo dõi', href: '/tracking?code=ORD-TEST' });
 assert.equal(orderListAction('tai-xe', { status: 'active', id: 'post-id' }, true), null);
 assert.equal(orderListAction('tai-xe', { status: 'completed' }, false), null);
});
