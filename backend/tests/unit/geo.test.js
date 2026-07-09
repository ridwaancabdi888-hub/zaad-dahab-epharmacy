const { haversineDistanceKm, estimateDeliveryWindow } = require('../../src/utils/geo');

describe('haversineDistanceKm', () => {
  it('returns ~0 for identical points', () => {
    const point = { lat: 2.0469, lng: 45.3182 };
    expect(haversineDistanceKm(point, point)).toBeCloseTo(0, 5);
  });

  it('computes a known distance between two real-world coordinates', () => {
    // Mogadishu -> Hargeisa is roughly 950km as the crow flies.
    const mogadishu = { lat: 2.0469, lng: 45.3182 };
    const hargeisa = { lat: 9.5624, lng: 44.065 };
    const distance = haversineDistanceKm(mogadishu, hargeisa);
    expect(distance).toBeGreaterThan(800);
    expect(distance).toBeLessThan(1000);
  });

  it('is symmetric', () => {
    const a = { lat: 2.0469, lng: 45.3182 };
    const b = { lat: 2.06, lng: 45.33 };
    expect(haversineDistanceKm(a, b)).toBeCloseTo(haversineDistanceKm(b, a), 10);
  });
});

describe('estimateDeliveryWindow', () => {
  it('produces a start before end, both after now', () => {
    const now = new Date('2026-01-01T12:00:00.000Z');
    const from = { lat: 2.06, lng: 45.33 };
    const to = { lat: 2.047, lng: 45.318 };

    const { start, end, distanceKm } = estimateDeliveryWindow(from, to, now);

    expect(start.getTime()).toBeGreaterThan(now.getTime());
    expect(end.getTime()).toBeGreaterThan(start.getTime());
    expect(distanceKm).toBeGreaterThan(0);
  });

  it('estimates a later window for a farther distance', () => {
    const now = new Date('2026-01-01T12:00:00.000Z');
    const destination = { lat: 2.0469, lng: 45.3182 };
    const near = estimateDeliveryWindow({ lat: 2.05, lng: 45.32 }, destination, now);
    const far = estimateDeliveryWindow({ lat: 2.5, lng: 45.8 }, destination, now);

    expect(far.start.getTime()).toBeGreaterThan(near.start.getTime());
  });

  it('never produces a window narrower than the minimum', () => {
    const now = new Date('2026-01-01T12:00:00.000Z');
    const point = { lat: 2.0469, lng: 45.3182 };
    // Essentially the same point — travel time would round to ~0.
    const { start, end } = estimateDeliveryWindow(point, { lat: 2.047, lng: 45.3183 }, now);

    expect(end.getTime() - start.getTime()).toBeGreaterThanOrEqual(10 * 60 * 1000);
  });
});
