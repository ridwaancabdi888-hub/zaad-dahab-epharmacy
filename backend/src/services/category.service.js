const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const ApiError = require('../utils/ApiError');
const slugify = require('../utils/slugify');

async function uniqueSlug(name, excludeId) {
  const base = slugify(name);
  let slug = base;
  let suffix = 1;
  while (await Category.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

async function create(payload) {
  const slug = await uniqueSlug(payload.name);
  return Category.create({ ...payload, slug });
}

async function list({ includeInactive = false, parent } = {}) {
  const filter = {};
  if (!includeInactive) {
    filter.isActive = true;
  }
  if (parent === 'null') {
    filter.parent = null;
  } else if (parent) {
    filter.parent = parent;
  }
  return Category.find(filter).sort({ sortOrder: 1, name: 1 });
}

async function getById(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw ApiError.notFound('Category not found');
  }
  return category;
}

async function update(id, payload) {
  const category = await getById(id);

  if (payload.name && payload.name !== category.name) {
    payload.slug = await uniqueSlug(payload.name, id);
  }

  Object.assign(category, payload);
  await category.save();
  return category;
}

async function remove(id) {
  const category = await getById(id);

  const inUse = await Medicine.exists({ category: id });
  if (inUse) {
    throw ApiError.conflict('Cannot delete a category that still has medicines assigned to it');
  }

  const hasChildren = await Category.exists({ parent: id });
  if (hasChildren) {
    throw ApiError.conflict('Cannot delete a category that has subcategories');
  }

  await category.deleteOne();
}

module.exports = { create, list, getById, update, remove };
