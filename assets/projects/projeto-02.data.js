export const CAPITAL_DATA = [
  { city: "Porto Velho", uf: "RO", male: 15117, female: 15945, lon: -63.9039, lat: -8.7619 },
  { city: "Rio Branco", uf: "AC", male: 12676, female: 13068, lon: -67.8243, lat: -9.97499 },
  { city: "Manaus", uf: "AM", male: 70234, female: 66577, lon: -60.0217, lat: -3.11903 },
  { city: "Boa Vista", uf: "RR", male: 15089, female: 14871, lon: -60.6753, lat: 2.82384 },
  { city: "Belem", uf: "PA", male: 44323, female: 40520, lon: -48.5039, lat: -1.45583 },
  { city: "Macapa", uf: "AP", male: 15006, female: 16891, lon: -51.0664, lat: 0.03493 },
  { city: "Palmas", uf: "TO", male: 10307, female: 11889, lon: -48.3336, lat: -10.1844 },
  { city: "Sao Luis", uf: "MA", male: 30568, female: 38875, lon: -44.3028, lat: -2.53874 },
  { city: "Teresina", uf: "PI", male: 26262, female: 25555, lon: -42.8034, lat: -5.09194 },
  { city: "Fortaleza", uf: "CE", male: 73387, female: 80676, lon: -38.5267, lat: -3.73186 },
  { city: "Natal", uf: "RN", male: 21982, female: 22379, lon: -35.211, lat: -5.79448 },
  { city: "Joao Pessoa", uf: "PB", male: 25628, female: 25012, lon: -34.8631, lat: -7.11532 },
  { city: "Recife", uf: "PE", male: 43557, female: 43766, lon: -34.877, lat: -8.04756 },
  { city: "Maceio", uf: "AL", male: 25394, female: 25491, lon: -35.735, lat: -9.64985 },
  { city: "Aracaju", uf: "SE", male: 18363, female: 20972, lon: -37.0731, lat: -10.9472 },
  { city: "Salvador", uf: "BA", male: 63958, female: 62197, lon: -38.5014, lat: -12.973 },
  { city: "Belo Horizonte", uf: "MG", male: 63972, female: 59378, lon: -43.9386, lat: -19.9208 },
  { city: "Vitoria", uf: "ES", male: 11126, female: 10920, lon: -40.3377, lat: -20.3155 },
  { city: "Rio de Janeiro", uf: "RJ", male: 162414, female: 149679, lon: -43.1729, lat: -22.9068 },
  { city: "Sao Paulo", uf: "SP", male: 357401, female: 297395, lon: -46.6333, lat: -23.5505 },
  { city: "Curitiba", uf: "PR", male: 51719, female: 51203, lon: -49.2733, lat: -25.4284 },
  { city: "Florianopolis", uf: "SC", male: 14534, female: 14200, lon: -48.5482, lat: -27.5949 },
  { city: "Porto Alegre", uf: "RS", male: 31937, female: 31985, lon: -51.2177, lat: -30.0346 },
  { city: "Campo Grande", uf: "MS", male: 28966, female: 27182, lon: -54.6201, lat: -20.4697 },
  { city: "Cuiaba", uf: "MT", male: 23259, female: 21965, lon: -56.0974, lat: -15.6014 },
  { city: "Goiania", uf: "GO", male: 39285, female: 39610, lon: -49.2643, lat: -16.6864 },
  { city: "Brasilia", uf: "DF", male: 91111, female: 85569, lon: -47.8825, lat: -15.7942 },
];

export const normalizeName = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

export const CAPITAL_DATA_NORMALIZED = CAPITAL_DATA.map((item) => ({
  ...item,
  cityNormalized: normalizeName(item.city),
}));

export const CAPITAL_TOTALS = {
  male: 1387575,
  female: 1313769,
};

export const MAX_COMBINED = Math.max(...CAPITAL_DATA.map((item) => Math.max(item.male, item.female)));
