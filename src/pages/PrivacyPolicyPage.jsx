import { useNavigate } from "react-router-dom";
import "../styles/privacy-policy.css";

function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <main className="privacy-page">
      <section className="privacy-card">
        <h1>Informace o zpracování osobních údajů</h1>

        <p>
          Tento dokument poskytuje informace o tom, jak jsou v rámci webové
          aplikace pro správu cestovatelských výletů zpracovávány osobní údaje
          uživatelů.

        </p>

        <h2>1. Správce osobních údajů</h2>
        <p>
          Správcem osobních údajů je provozovatel aplikace (dále jen
          „správce“), který zpracovává osobní údaje v souladu s platnými
          právními předpisy, zejména nařízením GDPR (Nařízení (EU) 2016/679).
        </p>

        <h2>2. Rozsah zpracovávaných údajů</h2>
        <p>V rámci aplikace jsou zpracovávány následující údaje:</p>

        <ul>
          <li><strong>Identifikační údaje:</strong> jméno uživatele</li>
          <li><strong>Kontaktní údaje:</strong> e-mailová adresa</li>
          <li>
            <strong>Přihlašovací údaje:</strong> heslo v zabezpečené (hashované)
            podobě
          </li>
          <li>
            <strong>Uživatelská data:</strong> informace o vytvořených výletech
            a souvisejících záznamech
          </li>
        </ul>

        <h2>3. Účel a právní základ zpracování</h2>
        <p>
          Osobní údaje jsou zpracovávány za účelem vytvoření a správy
          uživatelského účtu, přihlášení do aplikace a poskytování funkcionalit
          spojených s plánováním a evidencí výletů.
        </p>

        <p>Právním základem zpracování je:</p>

        <ul>
          <li>plnění smlouvy (vytvoření a správa uživatelského účtu)</li>
          <li>oprávněný zájem správce (zajištění bezpečnosti aplikace)</li>
          <li>souhlas uživatele (udělený při registraci)</li>
        </ul>

        <h2>4. Doba uchovávání údajů</h2>
        <p>
          Osobní údaje jsou uchovávány po dobu existence uživatelského účtu.
          Dočasné registrační údaje jsou automaticky odstraněny v případě,
          že uživatel nedokončí proces ověření e-mailové adresy.
        </p>

        <h2>5. Vaše práva</h2>
        <p>
          Máte právo požadovat výpis svých osobních údajů, jejich opravu,
          omezení zpracování nebo úplné smazání z naší databáze.
        </p>

        <p>
          V případě pochybností o zpracování osobních údajů máte právo obrátit
          se na příslušný dozorový orgán.
        </p>

        <div className="privacy-actions">
          <button
            className="btn-primary"
            onClick={() => navigate("/")}
          >
            Zpět k registraci
          </button>
        </div>
      </section>
    </main>
  );
}

export default PrivacyPolicyPage;