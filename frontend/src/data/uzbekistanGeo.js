/* Simplified GeoJSON for Uzbekistan administrative boundaries.
   Coordinates are approximate; accurate enough for visualization. */

export const REGIONS_GEO = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'karakalpakstan', name: "Qoraqalpog'iston AR", capital: 'Nukus' },
      geometry: { type: 'Polygon', coordinates: [[
        [56.0,45.5],[58.0,45.6],[60.5,45.6],[62.5,45.5],[64.0,44.2],
        [64.5,42.8],[63.5,41.5],[62.0,41.5],[62.0,41.0],[60.5,41.0],
        [59.5,41.5],[58.5,42.5],[57.5,43.3],[56.5,44.2],[56.0,45.0],[56.0,45.5]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'khorezm', name: 'Xorazm', capital: 'Urganch' },
      geometry: { type: 'Polygon', coordinates: [[
        [60.0,42.2],[62.0,42.3],[62.2,41.8],[62.0,41.5],[62.0,41.0],
        [60.5,41.0],[59.5,41.5],[60.0,42.0],[60.0,42.2]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'bukhara', name: 'Buxoro', capital: 'Buxoro' },
      geometry: { type: 'Polygon', coordinates: [[
        [62.0,41.5],[63.5,41.5],[64.5,42.8],[65.5,42.5],[66.5,41.8],
        [67.0,41.0],[66.5,40.0],[66.0,39.5],[65.5,38.5],[63.5,38.0],
        [62.0,38.5],[62.0,41.5]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'navoiy', name: 'Navoiy', capital: 'Navoiy' },
      geometry: { type: 'Polygon', coordinates: [[
        [63.5,41.5],[64.5,42.8],[67.0,43.2],[68.2,42.5],[68.5,41.5],
        [68.0,41.0],[68.0,40.5],[67.5,40.5],[67.0,41.0],[66.5,41.8],
        [65.5,42.5],[64.5,42.8],[63.5,41.5]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'samarkand', name: 'Samarqand', capital: 'Samarqand' },
      geometry: { type: 'Polygon', coordinates: [[
        [66.5,40.5],[67.0,41.0],[67.5,40.5],[68.0,40.5],[68.5,40.0],
        [68.5,39.5],[68.0,39.0],[67.5,38.5],[66.5,38.0],[65.5,38.5],
        [66.0,39.5],[66.5,40.0],[66.5,40.5]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'jizzakh', name: 'Jizzax', capital: 'Jizzax' },
      geometry: { type: 'Polygon', coordinates: [[
        [67.0,41.0],[68.2,42.5],[69.0,42.0],[69.5,41.5],[69.5,41.0],
        [69.0,40.5],[68.5,40.5],[68.0,40.5],[68.0,41.0],[67.5,40.5],
        [67.0,41.0]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'sirdarya', name: 'Sirdaryo', capital: 'Guliston' },
      geometry: { type: 'Polygon', coordinates: [[
        [68.5,41.5],[69.5,41.5],[70.5,41.2],[70.2,40.8],[70.0,40.5],
        [69.5,40.5],[69.0,40.5],[68.5,41.0],[68.5,41.5]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'tashkent_region', name: 'Toshkent viloyati', capital: 'Toshkent (viloyat)' },
      geometry: { type: 'Polygon', coordinates: [[
        [69.0,42.5],[70.5,42.5],[71.2,42.0],[71.5,41.5],[71.0,41.0],
        [70.5,40.8],[70.2,40.8],[70.0,41.2],[69.5,41.5],[68.5,41.5],
        [69.0,42.0],[69.0,42.5]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'tashkent_city', name: 'Toshkent shahri', capital: 'Toshkent' },
      geometry: { type: 'Polygon', coordinates: [[
        [69.15,41.22],[69.42,41.22],[69.42,41.40],[69.15,41.40],[69.15,41.22]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'namangan', name: 'Namangan', capital: 'Namangan' },
      geometry: { type: 'Polygon', coordinates: [[
        [70.5,42.2],[71.5,42.0],[72.0,41.8],[72.5,41.5],[72.8,40.8],
        [72.0,40.5],[71.5,40.5],[70.8,40.8],[70.5,41.2],[70.5,42.2]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'fergana', name: "Farg'ona", capital: "Farg'ona" },
      geometry: { type: 'Polygon', coordinates: [[
        [70.8,40.8],[71.5,40.5],[72.0,40.5],[72.8,40.8],[73.0,40.2],
        [72.5,39.8],[72.0,39.5],[71.0,39.8],[70.5,40.2],[70.8,40.8]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'andijan', name: 'Andijon', capital: 'Andijon' },
      geometry: { type: 'Polygon', coordinates: [[
        [72.0,40.8],[72.8,40.8],[73.2,40.4],[73.2,39.8],[72.5,39.5],
        [72.0,39.5],[71.5,40.0],[72.0,40.5],[72.0,40.8]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'kashkadarya', name: 'Qashqadaryo', capital: 'Qarshi' },
      geometry: { type: 'Polygon', coordinates: [[
        [66.0,39.5],[66.5,40.0],[67.5,40.0],[68.5,39.5],[69.0,38.5],
        [68.5,37.5],[67.0,37.2],[65.5,37.5],[65.5,38.5],[66.0,39.5]
      ]] }
    },
    {
      type: 'Feature',
      properties: { id: 'surkhandarya', name: 'Surxondaryo', capital: 'Termiz' },
      geometry: { type: 'Polygon', coordinates: [[
        [67.0,39.0],[68.5,39.5],[69.0,38.5],[70.0,38.0],[69.5,37.2],
        [68.0,37.0],[67.0,37.2],[68.5,37.5],[67.0,39.0]
      ]] }
    },
  ]
}

/* ─── Point-in-polygon check (ray casting) ─── */
function pip(point, polygon) {
  const [px, py] = point
  const ring = polygon
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if (((yi > py) !== (yj > py)) && (px < ((xj - xi) * (py - yi)) / (yj - yi) + xi))
      inside = !inside
  }
  return inside
}

/* ─── Generate fake but plausible district grid ─── */
function makeDistricts(region, cols, rows) {
  const ring = region.geometry.coordinates[0]
  const lons = ring.map(c => c[0]), lats = ring.map(c => c[1])
  const minLon = Math.min(...lons), maxLon = Math.max(...lons)
  const minLat = Math.min(...lats), maxLat = Math.max(...lats)
  const dLon = (maxLon - minLon) / cols
  const dLat = (maxLat - minLat) / rows
  const base = region.properties.id
  const features = []
  let idx = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lon0 = minLon + c * dLon
      const lat0 = minLat + r * dLat
      const cx = lon0 + dLon / 2
      const cy = lat0 + dLat / 2
      if (!pip([cx, cy], ring)) continue
      features.push({
        type: 'Feature',
        properties: {
          regionId: base,
          id: `${base}_d${idx++}`,
          name: DISTRICT_NAMES[base]?.[idx - 1] || `Tuman-${idx}`,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lon0, lat0],
            [lon0 + dLon * 0.98, lat0],
            [lon0 + dLon * 0.98, lat0 + dLat * 0.98],
            [lon0, lat0 + dLat * 0.98],
            [lon0, lat0],
          ]]
        }
      })
    }
  }
  return features
}

/* ─── District name lists ─── */
const DISTRICT_NAMES = {
  karakalpakstan: [
    'Amudaryo', 'Beruniy', 'Chimboy', 'Ellikqala', 'Kegeyli',
    'Mo\'ynoq', 'Nukus', 'Qanliko\'l', 'Qo\'ng\'irot', 'Shumanay',
    'Taxtako\'pir', 'To\'rtko\'l', 'Xo\'jayli', 'Nukus shahri', 'Bo\'zatov'
  ],
  khorezm: [
    'Bag\'ot', 'Gurlan', 'Xiva', 'Hazorasp', 'Urganch', 'Shovot', 'Yangiyo\'l', 'Qo\'shko\'pir'
  ],
  bukhara: [
    'Buxoro', 'G\'ijduvon', 'Jondor', 'Kogon', 'Olot', 'Peshku', 'Qorakul', 'Romitan', 'Shofirkon', 'Vobkent'
  ],
  navoiy: [
    'Karmana', 'Konimex', 'Navoiy sh.', 'Navbahor', 'Nurota', 'Qiziltepa', 'Tomdi', 'Uchquduq', 'Zarafshon'
  ],
  samarkand: [
    'Bulung\'ur', 'Ishtixon', 'Jomboy', 'Kattaqo\'rg\'on', 'Narpay', 'Nurobod', 'Oqdaryo', 'Payariq', 'Pastdarg\'om', 'Samarqand sh.', 'Toyloq', 'Urgut'
  ],
  jizzakh: [
    'Arnasoy', 'Baxmal', 'Do\'stlik', "G'allaorol", 'Jizzax sh.', 'Mirzacho\'l', 'Paxtakor', 'Sharof Rashidov', 'Yangiobod', 'Zomin'
  ],
  sirdarya: [
    'Boyovut', 'Guliston', 'Mirzaobod', 'Oqoltin', 'Sardoba', 'Sayxunobod', 'Shirin', 'Xavos'
  ],
  tashkent_region: [
    'Bektemir', 'Bo\'stonliq', 'Chinoz', 'Qibray', 'Ohangaron', 'Olmaliq', 'Parkent', 'Piskent', 'Quyichirchiq', 'Toshkent (v)', 'Yangiyo\'l', 'Zangiota', 'Yuqorichirchiq'
  ],
  tashkent_city: [
    'Yunusobod', 'Shayxontohur', 'Mirzo Ulug\'bek', 'Chilonzor'
  ],
  namangan: [
    'Chortoq', 'Chust', 'Kosonsoy', 'Mingbuloq', 'Namangan sh.', 'Norin', 'Pop', 'To\'raqo\'rg\'on', 'Uchqo\'rg\'on', 'Yangiqo\'rg\'on'
  ],
  fergana: [
    'Bag\'dod', 'Beshariq', 'Buvayda', 'Dang\'ara', 'Farg\'ona sh.', 'Furqat', 'Hamza', 'Marg\'ilon', 'Oltiariq', 'Qo\'shtepa', 'Rishton', 'So\'x', 'Toshloq', 'Uchko\'prik', 'Yozyovon'
  ],
  andijan: [
    'Andijon sh.', 'Asaka', 'Baliqchi', 'Bo\'z', 'Buloqboshi', 'Izboskan', 'Jalolquduq', 'Marhamat', 'Oltinko\'l', 'Paxtaobod', 'Qo\'rg\'ontepa', 'Shahrixon', 'Ulugnor', 'Xo\'jaobod'
  ],
  kashkadarya: [
    'Chiroqchi', 'Dehqonobod', 'G\'uzor', 'Kamashi', 'Kasbi', 'Kitob', 'Koson', 'Mirishkor', 'Muborak', 'Nishon', 'Qarshi sh.', 'Shahrisabz', 'Yakkabog\''
  ],
  surkhandarya: [
    'Angor', 'Bandixon', 'Boysun', 'Denov', 'Jarqo\'rg\'on', 'Muzrabot', 'Oltinsoy', 'Qiziriq', 'Qumqo\'rg\'on', 'Sariosiyo', 'Sherobod', 'Shorchi', 'Termiz sh.', 'Uzun'
  ],
}

/* ─── Build all districts ─── */
const GRID_SIZES = {
  karakalpakstan:  [5, 5],
  khorezm:         [3, 3],
  bukhara:         [4, 4],
  navoiy:          [4, 4],
  samarkand:       [3, 4],
  jizzakh:         [3, 3],
  sirdarya:        [3, 2],
  tashkent_region: [3, 3],
  tashkent_city:   [2, 2],
  namangan:        [3, 3],
  fergana:         [3, 3],
  andijan:         [3, 3],
  kashkadarya:     [3, 4],
  surkhandarya:    [3, 3],
}

export const DISTRICTS_GEO = {
  type: 'FeatureCollection',
  features: REGIONS_GEO.features.flatMap(r => {
    const [c, rr] = GRID_SIZES[r.properties.id] || [3, 3]
    return makeDistricts(r, c, rr)
  })
}
