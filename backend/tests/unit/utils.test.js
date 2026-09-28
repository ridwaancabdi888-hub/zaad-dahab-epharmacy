const crypto = require('crypto');

const escapeRegExp = require('../../src/utils/escapeRegExp');
const generateOrderNumber = require('../../src/utils/generateOrderNumber');
const { parsePagination, buildMeta } = require('../../src/utils/pagination');
const slugify = require('../../src/utils/slugify');

describe('escapeRegExp', () => {
  it('escapes every regular-expression metacharacter', () => {
    const input = 'C++ (basic) [v2].js? price=$5 | ready^';
    const expression = new RegExp(`^${escapeRegExp(input)}$`);

    expect(expression.test(input)).toBe(true);
    expect(expression.test('C-- (basic) [v2].js? price=$5 | ready^')).toBe(false);
  });

  it('coerces non-string values before escaping', () => {
    expect(escapeRegExp(42)).toBe('42');
    expect(escapeRegExp(null)).toBe('null');
  });
});

describe('parsePagination', () => {
  it('uses the default page and limit when query values are missing', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('parses valid values and calculates the number of records to skip', () => {
    expect(parsePagination({ page: '3', limit: '25' })).toEqual({
      page: 3,
      limit: 25,
      skip: 50,
    });
  });

  it('clamps page and limit to their minimum values', () => {
    expect(parsePagination({ page: '-4', limit: '0' })).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    });
  });

  it('caps the limit at the configured maximum', () => {
    expect(parsePagination({ page: '2', limit: '500' }, { maxLimit: 50 })).toEqual({
      page: 2,
      limit: 50,
      skip: 50,
    });
  });

  it('honors a custom default limit for invalid input', () => {
    expect(parsePagination({ page: 'invalid', limit: 'invalid' }, { defaultLimit: 15 })).toEqual({
      page: 1,
      limit: 15,
      skip: 0,
    });
  });
});

describe('buildMeta', () => {
  it('rounds partial pages up', () => {
    expect(buildMeta({ page: 2, limit: 20, total: 41 })).toEqual({
      page: 2,
      limit: 20,
      total: 41,
      totalPages: 3,
    });
  });

  it('reports zero pages for an empty result', () => {
    expect(buildMeta({ page: 1, limit: 20, total: 0 }).totalPages).toBe(0);
  });
});

describe('slugify', () => {
  it('normalizes case, whitespace, and punctuation', () => {
    expect(slugify('  Hargeisa Online Pharmacy!  ')).toBe('hargeisa-online-pharmacy');
  });

  it('collapses consecutive separators', () => {
    expect(slugify('Zaad / e-Dahab   Delivery')).toBe('zaad-e-dahab-delivery');
  });

  it('keeps numbers and trims separators from both ends', () => {
    expect(slugify('---Vitamin B12---')).toBe('vitamin-b12');
  });

  it('returns an empty slug when no supported characters remain', () => {
    expect(slugify('***')).toBe('');
  });
});

describe('generateOrderNumber', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses a cryptographically secure six-digit random value', () => {
    const randomInt = jest.spyOn(crypto, 'randomInt').mockReturnValue(654321);

    expect(generateOrderNumber()).toBe('ZD-654321');
    expect(randomInt).toHaveBeenCalledWith(100000, 999999);
  });
});
