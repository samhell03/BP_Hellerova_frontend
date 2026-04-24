import { useEffect, useMemo, useState } from "react";
import "../../styles/currencyconverter.css";
import {
  getCurrencyByCountryCode,
  getCurrencyLabel
} from "../../utils/countryCurrency";

const TARGET_CURRENCY = "CZK";

function formatCurrency(value, currency, fractionDigits = 2) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}

function parseAmount(value) {
  const normalized = String(value).replace(",", ".").trim();
  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

function CurrencyConverter({ countryCode }) {
  const sourceCurrency = useMemo(
    () => getCurrencyByCountryCode(countryCode),
    [countryCode]
  );

  const [amount, setAmount] = useState("1");
  const [rate, setRate] = useState(null);
  const [rateDate, setRateDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isReversed, setIsReversed] = useState(false);

  const inputCurrency = isReversed ? TARGET_CURRENCY : sourceCurrency;
  const outputCurrency = isReversed ? sourceCurrency : TARGET_CURRENCY;

  const numericAmount = parseAmount(amount);

  const convertedAmount = rate
    ? isReversed
      ? numericAmount / rate
      : numericAmount * rate
    : 0;

  useEffect(() => {
    setIsReversed(false);
    setAmount("1");
  }, [sourceCurrency]);

  useEffect(() => {
    if (!sourceCurrency) {
      setRate(null);
      setRateDate("");
      setErrorMessage("Pro tuto zemi zatím není nastavená měna.");
      return;
    }

    if (sourceCurrency === TARGET_CURRENCY) {
      setRate(1);
      setRateDate("");
      setErrorMessage("");
      return;
    }

    let isActive = true;

    const loadRate = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(
          `https://open.er-api.com/v6/latest/${sourceCurrency}`
        );

        if (!response.ok) {
          throw new Error("Kurz se nepodařilo načíst.");
        }

        const data = await response.json();

        if (!isActive) return;

        const nextRate = data?.rates?.[TARGET_CURRENCY];

        if (!nextRate) {
          throw new Error("Kurz pro tuto měnu není dostupný.");
        }

        setRate(nextRate);
        setRateDate(data?.time_last_update_utc || "");
      } catch (error) {
        if (!isActive) return;

        setRate(null);
        setRateDate("");
        setErrorMessage(error.message || "Kurz se nepodařilo načíst.");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    loadRate();

    return () => {
      isActive = false;
    };
  }, [sourceCurrency]);

  if (!sourceCurrency) {
    return (
      <section className="currency-card">
        <div className="currency-card-header">
          <h2>Měnová kalkulačka</h2>
          <p>{errorMessage}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="currency-card">
      <div className="currency-card-header">
        <div>
          <h2>Měnová kalkulačka</h2>
          <p>
            {getCurrencyLabel(inputCurrency)} → {getCurrencyLabel(outputCurrency)}
          </p>
        </div>

        <span className="currency-badge">
          {inputCurrency} → {outputCurrency}
        </span>
      </div>

      <div className="currency-converter">
        <label className="currency-field">
          <span>Částka v měně</span>

          <div className="currency-input-wrap">
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />

            <strong>{inputCurrency}</strong>
          </div>
        </label>

        <button
          type="button"
          className="currency-swap-button"
          onClick={() => setIsReversed((prev) => !prev)}
          aria-label="Prohodit měny"
          title="Prohodit měny"
          disabled={!rate || isLoading}
        >
          ⇄
        </button>

        <label className="currency-field">
          <span>Přepočet</span>

          <div className="currency-input-wrap currency-input-wrap-readonly">
            <input
              type="text"
              value={
                isLoading
                  ? "Načítám kurz…"
                  : rate
                    ? formatCurrency(convertedAmount, outputCurrency, 2)
                    : "—"
              }
              readOnly
            />

            <strong>{outputCurrency}</strong>
          </div>
        </label>
      </div>

      <div className="currency-footer">
        {sourceCurrency === TARGET_CURRENCY ? (
          <span>Měna destinace je stejná jako česká koruna.</span>
        ) : errorMessage ? (
          <span className="currency-error">{errorMessage}</span>
        ) : rate ? (
          <span>
            1 {sourceCurrency} = {formatCurrency(rate, TARGET_CURRENCY, 2)}
            {rateDate
              ? ` · kurz ze dne ${new Date(rateDate).toLocaleDateString("cs-CZ")}`
              : ""}
          </span>
        ) : (
          <span>Načítám aktuální kurz…</span>
        )}
      </div>
    </section>
  );
}

export default CurrencyConverter;