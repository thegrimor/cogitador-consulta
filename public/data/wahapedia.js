const https = require('http');
const fs = require('fs');

const files = ['Factions','Source','Datasheets','Datasheets_abilities','Datasheets_keywords','Datasheets_models','Datasheets_options','Datasheets_wargear','Datasheets_unit_composition','Datasheets_models_cost','Datasheets_stratagems','Datasheets_enhancements','Datasheets_detachment_abilities','Datasheets_leader','Stratagems','Abilities','Enhancements','Detachment_abilities','Detachments','Last_update'];

for (const f of files) {
  const dest = fs.createWriteStream(`${f}.csv`);
  https.get(`http://wahapedia.ru/wh40k10ed/${f}.csv`, r => r.pipe(dest));
}