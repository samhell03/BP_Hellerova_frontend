const EURO_COUNTRIES = new Set([
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES"
]);

const COUNTRY_CURRENCIES = {
  CZ: "CZK",
  US: "USD",
  CA: "CAD",
  GB: "GBP",
  CH: "CHF",
  JP: "JPY",
  AU: "AUD",
  NZ: "NZD",
  NO: "NOK",
  SE: "SEK",
  DK: "DKK",
  PL: "PLN",
  HU: "HUF",
  RO: "RON",
  BG: "BGN",
  TR: "TRY",
  EG: "EGP",
  TH: "THB",
  VN: "VND",
  ID: "IDR",
  IN: "INR",
  CN: "CNY",
  KR: "KRW",
  MX: "MXN",
  BR: "BRL",
  AE: "AED",
  MA: "MAD",
  TN: "TND",
  LK: "LKR",
  PE: "PEN"
};

export function getCurrencyByCountryCode(countryCode) {
  const code = (countryCode || "").trim().toUpperCase();

  if (!code) return null;

  if (EURO_COUNTRIES.has(code)) {
    return "EUR";
  }

  return COUNTRY_CURRENCIES[code] || null;
}

export function getCurrencyLabel(currencyCode) {
  const labels = {
    CZK: "česká koruna",
    EUR: "euro",
    USD: "americký dolar",
    CAD: "kanadský dolar",
    GBP: "britská libra",
    CHF: "švýcarský frank",
    JPY: "japonský jen",
    AUD: "australský dolar",
    NZD: "novozélandský dolar",
    NOK: "norská koruna",
    SEK: "švédská koruna",
    DKK: "dánská koruna",
    PLN: "polský zlotý",
    HUF: "maďarský forint",
    RON: "rumunský leu",
    BGN: "bulharský lev",
    TRY: "turecká lira",
    EGP: "egyptská libra",
    THB: "thajský baht",
    VND: "vietnamský dong",
    IDR: "indonéská rupie",
    INR: "indická rupie",
    CNY: "čínský jüan",
    KRW: "jihokorejský won",
    MXN: "mexické peso",
    BRL: "brazilský real",
    AED: "dirham SAE",
    MAD: "marocký dirham",
    TND: "tuniský dinár",
    LKR: "srílanská rupie",
    PEN: "peruánský sol",
  };

  return labels[currencyCode] || currencyCode;
}