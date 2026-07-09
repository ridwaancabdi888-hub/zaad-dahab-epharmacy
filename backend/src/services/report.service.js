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
 * "Revenue" throughout this dashboard means the sum of `total` on orders
 * that were never cancelled — the closest honest proxy to sales volume
 * this domain model supports, since Cash-on-Delivery orders don't have a
 * stricter "payment completed" signal until they're actually delivered.
 */
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
  const rows = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
  ]);

  const ordersByStatus = rows.map((row) => ({ status: row._id, count: row.count }));
  const totalOrders = rows.reduce((sum, row) => sum + row.count, 0);
  const cancelledOrders = rows.find((row) => row._id === 'cancelled')?.count || 0;
  const deliveredOrders = rows.find((row) => row._id === 'delivered')?.count || 0;
  const revenue = rows
    .filter((row) => row._id !== 'cancelled')
    .reduce((sum, row) => sum + row.revenue, 0);

  return { ordersByStatus, totalOrders, cancelledOrders, deliveredOrders, revenue };
}

/**
 * All date math here is done in UTC milliseconds (never local `Date`
 * getters/setters) so the bucket keys this generates line up exactly
 * with Mongo's `$dateToString`, which groups in UTC by default —
 * mixing the two caused "today"'s bucket to silently miss orders
 * whenever the server's local timezone wasn't UTC.
 */
async function revenueByDay() {
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const sinceUtcMs = todayUtcMs - (REVENUE_DAYS - 1) * MS_PER_DAY;

  const rows = await Order.aggregate([
    { $match: { ...NOT_CANCELLED, createdAt: { $gte: new Date(sinceUtcMs) } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
        revenue: { $sum: '$total' },
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
    },
    ordersByStatus,
    revenueByDay: revenueSeries,
    paymentsByMethod: payments,
    topMedicines: medicines,
  };
}

module.exports = { dashboard };
