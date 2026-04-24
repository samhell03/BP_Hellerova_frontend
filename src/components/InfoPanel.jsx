function InfoPanel() {
  return (
    <div className="bg-white p-6 rounded-2xl shadow space-y-4">
      <h3 className="font-bold">Aktuální info: Španělsko</h3>

      <p>☀️ Počasí: 32 °C</p>
      <p>💶 Kurz: 1 EUR = 25,20 CZK</p>

      <div className="bg-yellow-100 p-3 rounded-xl text-sm">
        ⚠️ Zvýšené riziko lesních požárů
      </div>
    </div>
  );
}

export default InfoPanel;
