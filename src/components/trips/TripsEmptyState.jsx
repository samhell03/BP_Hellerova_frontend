function TripsEmptyState({ onCreateTrip }) {
  return (
    <div className="my-trips-empty">
      <div className="my-trips-empty-icon"></div>
      <h3 className="my-trips-empty-title">Zatím nemáte žádný výlet</h3>
      <p className="my-trips-empty-text">
        Začněte naplánováním své první cesty a měj všechny výlety přehledně na jednom místě!.
      </p>
      <button className="btn-primary" onClick={onCreateTrip}>
        Vytvořit první výlet
      </button>
    </div>
  );
}

export default TripsEmptyState;