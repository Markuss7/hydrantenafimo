export default function CompassToast({ visible }) {
  if (!visible) return null;
  return (
    <div className="compass-toast">
      Bitte erlauben Sie den Zugriff auf die Geraeteausrichtung
    </div>
  );
}
