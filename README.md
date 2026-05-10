# Aplikace pro cestovatele – frontend
![Deployed on Vercel](https://img.shields.io/badge/deployed-Vercel-black)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?logo=vite&logoColor=white)

Frontendová část webové aplikace vytvořené v rámci bakalářské práce.  
Aplikace slouží k plánování a správě výletů, evidenci navštívených destinací, práci s cestovními balíčky, checklisty, poznámkami, kalendářem, statistikami a uživatelským účtem.

---

## Dokumentace aplikace

Uživatelská dokumentace aplikace, včetně návodů k jednotlivým funkcím, je dostupná zde:

https://samhell03.github.io/PDO-dokumentace-final/

---

## Použité technologie

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
- CSS
- [Leaflet](https://leafletjs.com/)
- [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)
- [React Icons](https://react-icons.github.io/react-icons/)
- [React Toastify](https://fkhadra.github.io/react-toastify/introduction/)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)

---

## Hlavní funkce

- registrace a přihlášení uživatele
- přihlášení pomocí Google účtu
- ověření e-mailu pomocí kódu
- obnova a změna hesla
- správa výletů
- detail výletu s mapou destinace
- checklist věcí k zabalení
- poznámky k výletu
- cestovní balíčky
- notifikace a upozornění
- kalendář výletů
- statistiky cestování
- export detailu výletu do PDF
- responzivní design pro mobil, tablet i desktop

---

## Požadavky na prostředí

Pro spuštění projektu je potřeba mít nainstalované následující nástroje:

- [Node.js](https://nodejs.org/) (doporučeno verze 18 nebo vyšší, obsahuje i npm)
- [npm](https://www.npmjs.com/) (správce balíčků pro JavaScript – je součástí Node.js)
- [Git](https://git-scm.com/) (pro stažení repozitáře)

### Doporučené vývojové prostředí

- [Visual Studio Code](https://code.visualstudio.com/)

## Instalace projektu

### 1. Naklonování repozitáře

```bash
git clone https://github.com/samhell03/BP_Hellerova_frontend.git
```

### 2. Přechod do složky projektu

```bash
cd BP_Hellerova_frontend
```

### 3. Instalace závislostí

```bash
npm install
```

---

## Proměnné prostředí

Pro správné fungování aplikace je nutné vytvořit konfigurační soubor `.env` v kořenové složce projektu.

Tento soubor obsahuje proměnné prostředí, které slouží ke konfiguraci komunikace s backendem a externími službami.

### Postup vytvoření

1. V kořenové složce projektu vytvoř nový soubor s názvem:

```bash
.env
```

2. Do souboru vložte následující obsah:

```env
VITE_API_URL=http://127.0.0.1:5000
VITE_AUTH_API_URL=http://127.0.0.1:5000/api/auth
VITE_GOOGLE_CLIENT_ID=google_client_id
```

---

### Význam proměnných

- `VITE_API_URL` – základní URL adresa backendu
- `VITE_AUTH_API_URL` – autentizační endpointy (přihlášení, registrace apod.)
- `VITE_GOOGLE_CLIENT_ID` – identifikátor pro Google přihlášení

---

### Důležité upozornění

Soubor `.env` není součástí repozitáře a neměl by obsahovat citlivé údaje.

Bez správně nastaveného `.env` nebude aplikace fungovat správně.

## Spuštění aplikace

```bash
npm run dev
```

Aplikace poběží například na:

```txt
http://localhost:5173
```

---

## Produkční build

```bash
npm run build
```

---

## Náhled produkční verze

```bash
npm run preview
```

---

## Nasazení

Frontend je nasazen a dostupný online na adrese:
https://muj-planovac-vyletu.vercel.app/

---

## Backend

Tento repozitář obsahuje pouze frontendovou část aplikace.

Backendová část aplikace je dostupná zde:

https://github.com/samhell03/BP_Hellerova_backend

Backend zajišťuje:

- autentizaci uživatele
- práci s databází
- správu výletů
- správu balíčků
- poznámky
- notifikace
- e-mailové služby

---

## Poznámka k provozu

Backend je nasazen na free hostingu, z tohoto důvodu může být při prvním požadavku delší odezva.
Důvodem je tzv. „probuzení serveru“ po delší době neaktivity.

---

**Samira Hellerová - TUL 2026**  
Bakalářská práce
