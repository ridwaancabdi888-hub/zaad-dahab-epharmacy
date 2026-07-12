const Order = require('../models/Order');
const Payment = require('../models/Payment');
const User = require('../models/User');
const Medicine = require('../models/Medicine');
const Category = require('../models/Category');
const Pharmacy = require('../models/Pharmacy');

const REVENUE_DAYS = 14;
const TOP_MEDICINES_LIMIT = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * "Revenue" throughout this dashboard means cash actually collected —
 * `Payment.amount` summed over `status: 'completed'` payments only, dated
 * by `paidAt` (when the money was actually received), not order-placement
 * time. A Zaad/e-Dahab payment completes as soon as the gateway confirms
 * it; a Cash-on-Delivery payment only completes when the rider marks the
 * delivery as delivered (see `delivery.service.js#updateStatus`) — so an
 * order sitting unpaid/undelivered correctly does not inflate revenue.
 */
const COMPLETED_PAYMENT = { status: 'completed' };
const NOT_CANCELLED = { status: { $ne: 'cancelled' } };

async function usersByRole() {
  const rows = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  const byRole = Object.fromEntries(rows.map((row) => [row._id, row.count]));
  return {
    customers: byRole.customer || 0,
    pharmacists: byRole.pharmacist || 0,
    riders: byRole.rider || 0,
    admins: byRole.admin || 0,
  };
}

async function orderTotals() {
  const [rows, [paymentRow]] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: COMPLETED_PAYMENT },
      { $group: { _id: null, revenue: { $sum: '$amount' } } },
    ]),
  ]);

  const ordersByStatus = rows.map((row) => ({ status: row._id, count: row.count }));
  const totalOrders = rows.reduce((sum, row) => sum + row.count, 0);
  const cancelledOrders = rows.find((row) => row._id === 'cancelled')?.count || 0;
  const deliveredOrders = rows.find((row) => row._id === 'delivered')?.count || 0;
  const revenue = paymentRow?.revenue || 0;

  return { ordersByStatus, totalOrders, cancelledOrders, deliveredOrders, revenue };
}

/**
 * All date math here is done in UTC milliseconds (never local `Date`
 * getters/setters) so the bucket keys this generates line up exactly
 * with Mongo's `$dateToString`, which groups in UTC by default —
 * mixing the two caused "today"'s bucket to silently miss orders
 * whenever the server's local timezone wasn't UTC.
 *
 * Buckets by `paidAt` (when a payment actually completed), not order
 * creation time — a Cash-on-Delivery order placed today but delivered
 * (and so paid) tomorrow shows up in tomorrow's revenue, matching when
 * the cash was actually collected.
 */
async function revenueByDay() {
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const sinceUtcMs = todayUtcMs - (REVENUE_DAYS - 1) * MS_PER_DAY;

  const rows = await Payment.aggregate([
    { $match: { ...COMPLETED_PAYMENT, paidAt: { $gte: new Date(sinceUtcMs) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: 'UTC' } },
        revenue: { $sum: '$amount' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  const byDate = new Map(rows.map((row) => [row._id, { revenue: row.revenue, orders: row.orders }]));

  const series = [];
  for (let i = 0; i < REVENUE_DAYS; i += 1) {
    const key = new Date(sinceUtcMs + i * MS_PER_DAY).toISOString().slice(0, 10);
    const entry = byDate.get(key);
    series.push({ date: key, revenue: entry?.revenue || 0, orders: entry?.orders || 0 });
  }
  return series;
}

async function paymentsByMethod() {
  const rows = await Payment.aggregate([
    {
      $group: {
        _id: '$method',
        count: { $sum: 1 },
        collectedAmount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] },
        },
      },
    },
  ]);
  return rows.map((row) => ({ method: row._id, count: row.count, collectedAmount: row.collectedAmount }));
}

async function topMedicines() {
  const rows = await Order.aggregate([
    { $match: NOT_CANCELLED },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.medicine',
        name: { $first: '$items.name' },
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.lineTotal' },
      },
    },
    { $sort: { unitsSold: -1 } },
    { $limit: TOP_MEDICINES_LIMIT },
  ]);
  return rows.map((row) => ({
    medicineId: row._id,
    name: row.name,
    unitsSold: row.unitsSold,
    revenue: row.revenue,
  }));
}

async function dashboard() {
  const [
    users,
    { ordersByStatus, totalOrders, cancelledOrders, deliveredOrders, revenue },
    revenueSeries,
    payments,
    medicines,
    medicineCount,
    categoryCount,
    pharmacyCount,
  ] = await Promise.all([
    usersByRole(),
    orderTotals(),
    revenueByDay(),
    paymentsByMethod(),
    topMedicines(),
    Medicine.countDocuments(),
    Category.countDocuments(),
    Pharmacy.countDocuments(),
  ]);

  return {
    totals: {
      ...users,
      medicines: medicineCount,
      categories: categoryCount,
      pharmacies: pharmacyCount,
      orders: totalOrders,
      deliveredOrders,
      cancelledOrders,
      revenue,
      // The last entry of `revenueByDay` is always today (UTC) — see that
      // function's doc comment — so no extra query is needed here.
      revenueToday: revenueSeries[revenueSeries.length - 1].revenue,
    },
    ordersByStatus,
    revenueByDay: revenueSeries,
    paymentsByMethod: payments,
    topMedicines: medicines,
  };
}

module.exports = { dashboard };
