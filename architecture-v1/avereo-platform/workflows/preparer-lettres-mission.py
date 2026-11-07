"""Préparer des lettres de travail Word à partir des modèles métier privés AVEREO."""
import argparse
import base64
import hashlib
import json
import re
import struct
import subprocess
import tempfile
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZipFile
from xml.etree import ElementTree

PLATFORM = Path(__file__).resolve().parents[1]
PROVIDER = "AVEREO - [DÉNOMINATION / FORME / CAPITAL / SIÈGE / SIREN-SIRET / RCS / TVA / REPRÉSENTANT À COMPLÉTER APRÈS IMMATRICULATION]"
def sha(data):
    return hashlib.sha256(data).hexdigest()

def identity():
    code = """const { AVEREO_NAME, AVEREO_COMPANY_LINES, AVEREO_LOGO } = await import(process.argv[1]);
    process.stdout.write(JSON.stringify({lines:[AVEREO_NAME,...AVEREO_COMPANY_LINES],logo:AVEREO_LOGO}));"""
    args = ["node", "--input-type=module", "-e", code, (PLATFORM / "shared/report-identity.js").as_uri()]
    profile = json.loads(subprocess.check_output(args))
    return profile["lines"], base64.b64decode(profile["logo"].split(",", 1)[1], validate=True)

def prepared_xml(original, lines, logo):
    xml = original.decode("utf-8")
    if xml.count(PROVIDER) != 1:
        raise ValueError("Bloc prestataire du modèle introuvable ou ambigu")
    company = "</w:t><w:br/><w:t>".join(escape(line) for line in [*lines, "Représentant : [À COMPLÉTER]"])
    xml = xml.replace(PROVIDER, company, 1)
    width, height = struct.unpack(">II", logo[16:24])
    def resize(match):
        cx = int(match["cx"])
        return match[0].replace('cy="' + match["cy"] + '"', f'cy="{round(cx * height / width)}"')
    xml, count = re.subn(r'<(?:wp:extent|a:ext) cx="(?P<cx>\d+)" cy="(?P<cy>\d+)"[^>]*/>', resize, xml)
    if count != 2:
        raise ValueError("Dimensions du logo du modèle inattendues")
    result = xml.encode("utf-8")
    ElementTree.fromstring(result)
    return result

def prepare(sources, destination):
    catalog = json.loads((PLATFORM / "data/modeles-lettres-mission.json").read_text(encoding="utf-8"))
    offers = catalog["offres"]
    if destination.exists():
        raise ValueError("Utilisez un nouveau dossier de sortie")
    lines, logo = identity()
    records = []
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=destination.parent) as temp:
        staged = Path(temp) / "lettres"
        staged.mkdir()
        for offer in offers:
            source = sources / offer["fichier"]
            if sha(source.read_bytes()) != offer["sha256"]:
                raise ValueError("Version du modèle métier à vérifier : " + source.name)
            target = staged / ("lettre-mission-" + offer["id"] + ".docx")
            with ZipFile(source) as original, ZipFile(target, "w") as output:
                for item in original.infolist():
                    content = original.read(item)
                    if item.filename == "word/document.xml":
                        content = prepared_xml(content, lines, logo)
                    elif item.filename == "word/media/image1.png":
                        content = logo
                    output.writestr(item, content)
            if sha(target.read_bytes()) != offer["modelePrepareSha256"]:
                raise ValueError("Copie différente du catalogue : " + target.name + ". Vérifier le profil AVEREO et le moteur ZIP qualifié dans workflows/README.md.")
            records.append({"offre": offer["id"], "sourceSha256": offer["sha256"], "fichier": target.name, "sha256": sha(target.read_bytes())})
        (staged / "manifest.json").write_text(json.dumps({"statut":"modèles de travail à personnaliser", "logoSha256":sha(logo), "lettres":records},ensure_ascii=False,indent=2) + "\n",encoding="utf-8")
        staged.rename(destination)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sources", required=True, type=Path)
    parser.add_argument("--sortie", required=True, type=Path)
    args = parser.parse_args()
    prepare(args.sources, args.sortie)
