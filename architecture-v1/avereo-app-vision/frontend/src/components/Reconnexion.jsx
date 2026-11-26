// Même fenêtre : CONNECT revient ensuite dans Vision par la passerelle.
export default function Reconnexion({ portal, durable = true }) {
  return <>
    <p>{durable
      ? "Votre session a expiré. Vos modifications enregistrées restent sur cet appareil et seront envoyées après reconnexion avec le même compte."
      : "Votre session a expiré. Le stockage durable est indisponible : les modifications risquent d’être perdues en quittant cette page."}</p>
    {portal ? <a className="bouton" href={`${portal}?app=vision`}>Se reconnecter</a>
      : <p>Ouvrez AVEREO Vision depuis AVEREO CONNECT.</p>}
  </>;
}
