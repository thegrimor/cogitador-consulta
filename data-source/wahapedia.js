const https = require('https');
const fs = require('fs');
const path = require('path');

const files = ['Factions','Source','Datasheets','Datasheets_abilities','Datasheets_keywords','Datasheets_models','Datasheets_options','Datasheets_wargear','Datasheets_unit_composition','Datasheets_models_cost','Datasheets_stratagems','Datasheets_enhancements','Datasheets_detachment_abilities','Datasheets_leader','Stratagems','Abilities','Enhancements','Detachment_abilities','Detachments','Last_update'];

function download(file) {
  return new Promise((resolve, reject) => {
    const url = `https://wahapedia.ru/wh40k10ed/${file}.csv`;
    const dest = path.join(__dirname, `${file}.csv`);
    const out = fs.createWriteStream(dest);

    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        out.close();
        https.get(res.headers.location, (res2) => {
          res2.pipe(out);
          out.on('finish', () => { out.close(); console.log(`✓ ${file}.csv`); resolve(); });
        }).on('error', reject);
      } else {
        res.pipe(out);
        out.on('finish', () => { out.close(); console.log(`✓ ${file}.csv`); resolve(); });
      }
    }).on('error', reject);
  });
}

(async () => {
  for (const f of files) await download(f);
  console.log('¡Listo!');
})();