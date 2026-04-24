import TripCard from "./TripCard";

function TripList({ trips, onEditTrip, onDeleteTrip, countryNameMap }) {
  return (
    <div className="my-trips-list">
      {trips.map((trip) => (
        <TripCard
          key={trip._id}
          trip={trip}
          onEditTrip={onEditTrip}
          onDeleteTrip={onDeleteTrip}
          countryNameMap={countryNameMap}
        />
      ))}
    </div>
  );
}

export default TripList;
