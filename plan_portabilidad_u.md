# Plan de Portabilidad: Sistema de Sugerencias "Quizás quisiste decir" (Fuzzy Search)

Este documento contiene las especificaciones técnicas completas y los archivos modificados en la rama de producción para que puedan ser aplicados en la rama de desarrollo local/universidad sin alterar variables de conexión (`.env`), configuraciones de APIs ni el login tradicional sin OAuth.

---

## 📂 Archivos Nuevos a Crear

### 1. Diccionario de Pokémon
Crea el archivo `frontend/src/utils/pokemonDictionary.js` y pega el siguiente contenido:

```javascript
// Diccionario oficial con los nombres de todos los Pokémon (Generaciones 1 a 9)
export const POKEMON_NAMES = [
  // Gen 1
  "Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard",
  "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree",
  "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot",
  "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok",
  "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina",
  "Nidoqueen", "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable",
  "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat",
  "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat",
  "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck",
  "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag",
  "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop",
  "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool",
  "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash",
  "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo",
  "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder",
  "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee",
  "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute",
  "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung",
  "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela",
  "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu",
  "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar",
  "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto",
  "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte",
  "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno",
  "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo",
  "Mew",

  // Gen 2
  "Chikorita", "Bayleef", "Meganium", "Cyndaquil", "Quilava", "Typhlosion",
  "Totodile", "Croconaw", "Feraligatr", "Sentret", "Furret", "Hoothoot",
  "Noctowl", "Ledyba", "Ledian", "Spinarak", "Ariados", "Crobat",
  "Chinchou", "Lanturn", "Pichu", "Cleffa", "Igglybuff", "Togepi",
  "Togetic", "Natu", "Xatu", "Mareep", "Flaaffy", "Ampharos",
  "Bellossom", "Marill", "Azumarill", "Sudowoodo", "Politoed", "Hoppip",
  "Skiploom", "Jumpluff", "Aipom", "Sunkern", "Sunflora", "Yanma",
  "Wooper", "Quagsire", "Espeon", "Umbreon", "Murkrow", "Slowking",
  "Misdreavus", "Unown", "Wobbuffet", "Girafarig", "Pineco", "Forretress",
  "Dunsparce", "Gligar", "Steelix", "Snubbull", "Granbull", "Qwilfish",
  "Scizor", "Shuckle", "Heracross", "Sneasel", "Teddiursa", "Ursaring",
  "Slugma", "Magcargo", "Swinub", "Piloswine", "Corsola", "Remoraid",
  "Octillery", "Delibird", "Mantine", "Skarmory", "Houndour", "Houndoom",
  "Kingdra", "Phanpy", "Donphan", "Porygon2", "Stantler", "Smeargle",
  "Tyrogue", "Hitmontop", "Smoochum", "Elekid", "Magby", "Miltank",
  "Blissey", "Raikou", "Entei", "Suicune", "Larvitar", "Pupitar",
  "Tyranitar", "Lugia", "Ho-Oh", "Celebi",

  // Gen 3
  "Treecko", "Grovyle", "Sceptile", "Torchic", "Combusken", "Blaziken",
  "Mudkip", "Marshtomp", "Swampert", "Poochyena", "Mightyena", "Zigzagoon",
  "Linoone", "Wurmple", "Silcoon", "Beautifly", "Cascoon", "Dustox",
  "Lotad", "Lombre", "Ludicolo", "Seedot", "Nuzleaf", "Shiftry",
  "Taillow", "Swellow", "Wingull", "Pelipper", "Ralts", "Kirlia",
  "Gardevoir", "Surskit", "Masquerain", "Shroomish", "Breloom", "Slakoth",
  "Vigoroth", "Slaking", "Nincada", "Ninjask", "Shedinja", "Whismur",
  "Loudred", "Exploud", "Makuhita", "Hariyama", "Azurill", "Nosepass",
  "Skitty", "Delcatty", "Sableye", "Mawile", "Aron", "Lairon",
  "Aggron", "Meditite", "Medicham", "Electrike", "Manectric", "Plusle",
  "Minun", "Volbeat", "Illumise", "Roselia", "Gulpin", "Swalot",
  "Carvanha", "Sharpedo", "Wailmer", "Wailord", "Numel", "Camerupt",
  "Torkoal", "Spoink", "Grumpig", "Spinda", "Trapinch", "Vibrava",
  "Flygon", "Cacnea", "Cacturne", "Swablu", "Altaria", "Zangoose",
  "Seviper", "Lunatone", "Solrock", "Barboach", "Whiscash", "Corphish",
  "Crawdaunt", "Baltoy", "Claydol", "Lileep", "Cradily", "Anorith",
  "Armaldo", "Feebas", "Milotic", "Castform", "Kecleon", "Shuppet",
  "Banette", "Duskull", "Dusclops", "Tropius", "Chimecho", "Absol",
  "Wynaut", "Snorunt", "Glalie", "Spheal", "Sealeo", "Walrein",
  "Clamperl", "Huntail", "Gorebyss", "Relicanth", "Luvdisc", "Bagon",
  "Shelgon", "Salamence", "Beldum", "Metang", "Metagross", "Regirock",
  "Regice", "Registeel", "Latias", "Latios", "Kyogre", "Groudon",
  "Rayquaza", "Jirachi", "Deoxys",

  // Gen 4
  "Turtwig", "Grotle", "Torterra", "Chimchar", "Monferno", "Infernape",
  "Piplup", "Prinplup", "Empoleon", "Starly", "Staravia", "Staraptor",
  "Bidoof", "Bibarel", "Kricketot", "Kricketune", "Shinx", "Luxio",
  "Luxray", "Budew", "Roserade", "Cranidos", "Rampardos", "Shieldon",
  "Bastiodon", "Burmy", "Wormadam", "Mothim", "Combee", "Vespiquen",
  "Pachirisu", "Buizel", "Floatzel", "Cherubi", "Cherrim", "Shellos",
  "Gastrodon", "Ambipom", "Drifloon", "Drifblim", "Buneary", "Lopunny",
  "Mismagius", "Honchkrow", "Glameow", "Purugly", "Chingling", "Stunky",
  "Skuntank", "Bronzor", "Bronzong", "Bonsly", "Mime Jr.", "Happiny",
  "Chatot", "Spiritomb", "Gible", "Gabite", "Garchomp", "Munchlax",
  "Riolu", "Lucario", "Hippopotas", "Hippowdon", "Skorupi", "Drapion",
  "Croagunk", "Toxicroak", "Carnivine", "Finneon", "Lumineon", "Mantyke",
  "Snover", "Abomasnow", "Weavile", "Magnezone", "Lickilicky", "Rhyperior",
  "Tangrowth", "Electivire", "Magmortar", "Togekiss", "Yanmega", "Leafeon",
  "Glaceon", "Gliscor", "Mamoswine", "Porygon-Z", "Gallade", "Probopass",
  "Dusknoir", "Froslass", "Rotom", "Uxie", "Mesprit", "Azelf",
  "Dialga", "Palkia", "Heatran", "Regigigas", "Giratina", "Cresselia",
  "Phione", "Manaphy", "Darkrai", "Shaymin", "Arceus",

  // Gen 5
  "Victini", "Snivy", "Servine", "Serperior", "Tepig", "Pignite",
  "Emboar", "Oshawott", "Dewott", "Samurott", "Patrat", "Watchog",
  "Lillipup", "Herdier", "Stoutland", "Purrloin", "Liepard", "Pansage",
  "Simisage", "Pansear", "Simisear", "Panpour", "Simipour", "Munna",
  "Musharna", "Pidove", "Tranquill", "Unfezant", "Blitzle", "Zebstrika",
  "Roggenrola", "Boldore", "Gigalith", "Woobat", "Swoobat", "Drilbur",
  "Excadrill", "Audino", "Timburr", "Gurdurr", "Conkeldurr", "Tympole",
  "Palpitoad", "Seismitoad", "Throh", "Sawk", "Sewaddle", "Swadoon",
  "Leavanny", "Venipede", "Whirlipede", "Scolipede", "Cottonee", "Whimsicott",
  "Petilil", "Lilligant", "Basculin", "Sandile", "Krokorok", "Krookodile",
  "Darumaka", "Darmanitan", "Maractus", "Dwebble", "Crustle", "Scraggy",
  "Scrafty", "Sigilyph", "Yamask", "Cofagrigus", "Tirtouga", "Carracosta",
  "Archen", "Archeops", "Trubbish", "Garbodor", "Zorua", "Zoroark",
  "Minccino", "Cinccino", "Gothita", "Gothorita", "Gothitelle", "Solosis",
  "Duosion", "Reuniclus", "Ducklett", "Swanna", "Vanillite", "Vanillish",
  "Vanilluxe", "Deerling", "Sawsbuck", "Emolga", "Karrablast", "Escavalier",
  "Foongus", "Amoonguss", "Frillish", "Jellicent", "Alomomola", "Joltik",
  "Galvantula", "Ferroseed", "Ferrothorn", "Klink", "Klang", "Klinklang",
  "Tynamo", "Eelektrik", "Eelektross", "Elgyem", "Beheeyem", "Litwick",
  "Lampent", "Chandelure", "Axew", "Fraxure", "Haxorus", "Cubchoo",
  "Beartic", "Cryogonal", "Shelmet", "Accelgor", "Stunfisk", "Mienfoo",
  "Mienshao", "Druddigon", "Golett", "Golurk", "Pawniard", "Bisharp",
  "Bouffalant", "Rufflet", "Braviary", "Vullaby", "Mandibuzz", "Heatmor",
  "Durant", "Deino", "Wailmer", "Hydreigon", "Larvesta", "Volcarona",
  "Cobalion", "Terrakion", "Virizion", "Tornadus", "Thundurus", "Reshiram",
  "Zekrom", "Landorus", "Kyurem", "Keldeo", "Meloetta", "Genesect",

  // Gen 6
  "Chespin", "Quilladin", "Chesnaught", "Fennekin", "Braixen", "Delphox",
  "Froakie", "Frogadier", "Greninja", "Bunnelby", "Diggersby", "Fletchling",
  "Fletchinder", "Talonflame", "Scatterbug", "Spewpa", "Vivillon", "Litleo",
  "Pyroar", "Flabébé", "Floette", "Florges", "Skiddo", "Gogoat",
  "Pancham", "Pangoro", "Furfrou", "Espurr", "Meowstic", "Honedge",
  "Doublade", "Aegislash", "Spritzee", "Aromatisse", "Swirlix", "Slurpuff",
  "Inkay", "Malamar", "Binacle", "Barbaracle", "Skrelp", "Dragalge",
  "Clauncher", "Clawitzer", "Helioptile", "Heliolisk", "Tyrunt", "Tyrantrum",
  "Amaura", "Aurorus", "Sylveon", "Hawlucha", "Dedenne", "Carbink",
  "Goomy", "Sliggoo", "Goodra", "Phantump", "Trevenant", "Pumpkaboo",
  "Gourgeist", "Bergmite", "Avalugg", "Noibat", "Noivern", "Xerneas",
  "Yveltal", "Zygarde", "Diancie", "Hoopa", "Volcanion",

  // Gen 7
  "Rowlet", "Dartrix", "Decidueye", "Litten", "Torracat", "Incineroar",
  "Popplio", "Brionne", "Primarina", "Pikipek", "Trumbeak", "Toucannon",
  "Yungoos", "Gumshoos", "Grubbin", "Charjabug", "Vikavolt", "Crabrawler",
  "Crabominable", "Oricorio", "Cutiefly", "Ribombee", "Rockruff", "Lycanroc",
  "Wishiwashi", "Mareanie", "Toxapex", "Mudbray", "Mudsdale", "Dewpider",
  "Araquanid", "Fomantis", "Lurantis", "Morelull", "Shiinotic", "Salandit",
  "Salazzle", "Stufful", "Bewear", "Bounsweet", "Steenee", "Tsareena",
  "Comfey", "Oranguru", "Passimian", "Wimpod", "Golisopod", "Sandygast",
  "Palossand", "Pyukumuku", "Type: Null", "Silvally", "Minior", "Komala",
  "Turtonator", "Togedemaru", "Mimikyu", "Bruxish", "Drampa", "Dhelmise",
  "Jangmo-o", "Hakamo-o", "Kommo-o", "Tapu Koko", "Tapu Lele", "Tapu Bulu",
  "Tapu Fini", "Cosmog", "Cosmoem", "Solgaleo", "Lunala", "Nihilego",
  "Buzzwole", "Pheromosa", "Xurkitree", "Celesteela", "Kartana", "Guzzlord",
  "Necrozma", "Magearna", "Marshadow", "Poipole", "Naganadel", "Stakataka",
  "Blacephalon", "Zeraora", "Meltan", "Melmetal",

  // Gen 8
  "Grookey", "Thwackey", "Rillaboom", "Scorbunny", "Raboot", "Cinderace",
  "Sobble", "Drizzile", "Inteleon", "Skwovet", "Greedent", "Rookidee",
  "Corvisquire", "Corviknight", "Blipbug", "Dottler", "Orbeetle", "Nickit",
  "Thievul", "Gossifleur", "Eldegoss", "Wooloo", "Dubwool", "Chewtle",
  "Drednaw", "Yamper", "Boltund", "Rolycoly", "Carkol", "Coalossal",
  "Applin", "Flapple", "Appletun", "Silicobra", "Sandaconda", "Cramorant",
  "Arrokuda", "Barraskewda", "Toxel", "Toxtricity", "Sizzlipede", "Centiskorch",
  "Clobbopus", "Grapploct", "Sinistea", "Polteageist", "Hatenna", "Hattrem",
  "Hatterene", "Impidimp", "Morgrem", "Grimmsnarl", "Obstagoon", "Perrserker",
  "Cursola", "Sirfetch'd", "Mr. Rime", "Runerigus", "Milcery", "Alcremie",
  "Falinks", "Pincurchin", "Snom", "Frosmoth", "Stonjourner", "Eiscue",
  "Indeedee", "Morpeko", "Cufant", "Copperajah", "Dracozolt", "Arctozolt",
  "Dracovish", "Arctovish", "Duraludon", "Dreepy", "Drakloak", "Dragapult",
  "Zacian", "Zamazenta", "Eternatus", "Kubfu", "Urshifu", "Zarude",
  "Regieleki", "Regidrago", "Glastrier", "Spectrier", "Calyrex",
  "Wyrdeer", "Kleavor", "Lunaone", "Sneasler", "Overqwil",
  "Enamorus",

  // Gen 9
  "Sprigatito", "Floragato", "Meowscarada", "Fuecoco", "Crocalor", "Skeledirge",
  "Quaxly", "Quaxwell", "Quaquaval", "Lechonk", "Oinkologne", "Tarountula",
  "Spidops", "Nymble", "Lokix", "Pawmi", "Pawmo", "Pawmot",
  "Tandemaus", "Maushold", "Fidough", "Dachsbun", "Smoliv", "Dolliv",
  "Arboliva", "Squawkabilly", "Nacli", "Naclstack", "Garganacl", "Charcadet",
  "Armarouge", "Ceruledge", "Tadbulb", "Bellibolt", "Wattrel", "Kilowattrel",
  "Maschiff", "Mabosstiff", "Shroodle", "Grafaiai", "Bramblin", "Bramghast",
  "Toedscool", "Toedscruel", "Klawf", "Capsakid", "Scovillain", "Rellor",
  "Rabsca", "Flittle", "Espathura", "Tinkatink", "Tinkatuff", "Tinkaton",
  "Wiglett", "Wugtrio", "Bombirdier", "Finizen", "Palafin", "Varoom",
  "Revavroom", "Cyclizar", "Orthworm", "Glimmet", "Glimmora", "Greavard",
  "Houndstone", "Flamigo", "Cetoddle", "Cetitan", "Veluza", "Dondozo",
  "Tatsugiri", "Annihilape", "Clodsire", "Farigiraf", "Dudunsparce", "Kingambit",
  "Great Tusk", "Scream Tail", "Brute Bonnet", "Flutter Mane", "Slither Wing", "Sandy Shocks",
  "Iron Treads", "Iron Bundle", "Iron Hands", "Iron Jugulis", "Iron Moth", "Iron Thorns",
  "Frigibax", "Arctibax", "Baxcalibur", "Gimmighoul", "Gholdengo", "Wo-Chien",
  "Chien-Pao", "Ting-Lu", "Chi-Yu", "Roaring Moon", "Iron Valiant", "Koraidon",
  "Miraidon", "Walking Wake", "Iron Leaves", "Dipplin", "Poltchageist", "Sinistcha",
  "Okidogi", "Munkidori", "Fezandipiti", "Ogerpon"
];
```

---

### 2. Algoritmo de Distancia de Levenshtein
Crea el archivo `frontend/src/utils/similarity.js` y pega lo siguiente:

```javascript
import { POKEMON_NAMES } from './pokemonDictionary';

/**
 * Calcula la distancia de Levenshtein entre dos cadenas de texto.
 */
export function getLevenshteinDistance(a, b) {
  const matrix = [];
  const strA = a.toLowerCase().trim();
  const strB = b.toLowerCase().trim();

  if (strA.length === 0) return strB.length;
  if (strB.length === 0) return strA.length;

  for (let i = 0; i <= strB.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= strA.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= strB.length; i++) {
    for (let j = 1; j <= strA.length; j++) {
      if (strB.charAt(i - 1) === strA.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // Sustitución
          Math.min(
            matrix[i][j - 1] + 1, // Inserción
            matrix[i - 1][j] + 1  // Eliminación
          )
        );
      }
    }
  }

  return matrix[strB.length][strA.length];
}

/**
 * Busca y retorna la sugerencia más cercana para un término de búsqueda.
 */
export function getSpellingSuggestion(input) {
  if (!input || typeof input !== 'string') return null;
  
  const cleanInput = input.trim().toLowerCase();
  if (cleanInput.length < 3) return null;

  let bestMatch = null;
  let minDistance = Infinity;

  for (const name of POKEMON_NAMES) {
    const cleanName = name.toLowerCase();
    
    if (cleanName === cleanInput) {
      return null;
    }

    const distance = getLevenshteinDistance(cleanInput, cleanName);

    if (distance < minDistance) {
      minDistance = distance;
      bestMatch = name;
    }
  }

  // Tolerancia inteligente basada en longitud
  const tolerance = cleanInput.length <= 4 ? 1 : (cleanInput.length <= 7 ? 2 : 3);

  if (minDistance <= tolerance) {
    console.log(`🔮 [Levenshtein] Sugerencia encontrada: "${input}" -> "${bestMatch}" (distancia: ${minDistance})`);
    return bestMatch;
  }

  return null;
}
```

---

## 📝 Modificaciones a Archivos Existentes

### 1. Modificar `frontend/src/BuscarCarta.jsx` (Buscador Público)

#### Importar la utilidad de sugerencia:
```javascript
import { getSpellingSuggestion } from './utils/similarity';
```

#### Añadir un estado para trackear el último término consultado:
```javascript
const [lastSearchTerm, setLastSearchTerm] = useState('');
```

#### Guardar el término al ejecutar la búsqueda:
```javascript
const buscarCartas = async (overrideTerm) => {
  const terminoParaBuscar = typeof overrideTerm === 'string' ? overrideTerm : nombre;
  if (!terminoParaBuscar.trim()) return;

  setLoading(true);
  setError('');
  setLastSearchTerm(terminoParaBuscar); // <-- GUARDAR ÚLTIMO TÉRMINO

  // ...resto del código de búsqueda...
}
```

#### Renderizar la sugerencia cuando el resultado está vacío:
Ubica la sección donde renderizas el mensaje de error o sin resultados y añade esto:
```jsx
{!loading && lastSearchTerm && cartas.length === 0 && (
  <div className="no-results-warning" style={{
    gridColumn: '1 / -1',
    background: 'rgba(255, 255, 255, 0.08)',
    borderLeft: '5px solid #0056b3',
    padding: '25px',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '20px auto',
    color: 'white'
  }}>
    <h3 style={{ margin: '0 0 10px 0', color: '#ffb703' }}>⚠️ Búsqueda sin resultados</h3>
    <p>No encontramos cartas para "{lastSearchTerm}".</p>
    
    {(() => {
      const sugerencia = getSpellingSuggestion(lastSearchTerm);
      if (sugerencia) {
        return (
          <div style={{
            margin: '15px 0',
            padding: '10px 20px',
            background: 'rgba(0, 86, 179, 0.25)',
            borderRadius: '8px',
            border: '1px solid rgba(0, 86, 179, 0.4)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🔮 ¿Quizás quisiste decir:</span>
            <button
              onClick={() => {
                setNombre(sugerencia);
                buscarCartas(sugerencia);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#38b000',
                fontWeight: 'bold',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: 0
              }}
            >
              {sugerencia}
            </button>
            <span>?</span>
          </div>
        );
      }
      return null;
    })()}
  </div>
)}
```

---

### 2. Modificar `frontend/src/BuscarCartaAdmin.jsx` (Buscador Administrativo)

#### Importar la utilidad de sugerencia:
```javascript
import { getSpellingSuggestion } from './utils/similarity';
```

#### Añadir el estado `lastSearchTerm` en los useState del componente:
```javascript
const [lastSearchTerm, setLastSearchTerm] = useState('');
```

#### Modificar la función `buscarEnAPI` para guardar el término y aceptar overrides:
```javascript
const buscarEnAPI = async (overrideTerm) => {
  const terminoParaBuscar = typeof overrideTerm === 'string' ? overrideTerm : nombre;
  if (!terminoParaBuscar.trim() && !supertipo) {
    setError('Por favor ingresa un término de búsqueda o selecciona un tipo de carta');
    return;
  }

  setLoading(true);
  setError('');
  setCartasAPI([]);
  setResultadoActualizacion(null);
  setSelectedCards(new Set());
  setLastSearchTerm(terminoParaBuscar); // <-- GUARDAR TÉRMINO

  // ...resto del fetch...
}
```

#### Modificar `limpiarBusqueda` para reiniciar el estado:
```javascript
const limpiarBusqueda = () => {
  setNombre('');
  setSupertipo('');
  setSelectedCards(new Set());
  setCartasAPI([]);
  setError('');
  setResultadoActualizacion(null);
  setLastSearchTerm(''); // <-- LIMPIAR ESTADO
};
```

#### Renderizar la sugerencia en la alerta de sin resultados:
Ubica la sección `{error && ...}` y añade abajo el bloque de "sin resultados":
```jsx
{/* Alerta de sin resultados con sugerencia ortográfica */}
{!loading && lastSearchTerm && cartasAPI.length === 0 && !resultadoActualizacion && (
  <div className="no-results-warning" style={{
    gridColumn: '1 / -1',
    background: 'white',
    borderLeft: '5px solid #ff9800',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
    textAlign: 'left',
    maxWidth: '600px',
    margin: '20px auto',
    color: '#4a5568'
  }}>
    <h3 style={{ margin: '0 0 10px 0', color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
      ⚠️ Búsqueda sin resultados
    </h3>
    <p style={{ margin: '0 0 15px 0', fontSize: '0.95rem', lineHeight: '1.5' }}>
      No encontramos cartas para "<strong>{lastSearchTerm}</strong>" {activeTab === 'coleccionar' ? 'en la base de datos local' : 'en la API de Pokémon TCG'}.
    </p>

    {(() => {
      const sugerencia = getSpellingSuggestion(lastSearchTerm);
      if (sugerencia) {
        return (
          <div style={{
            margin: '15px 0',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
            borderRadius: '8px',
            borderLeft: '4px solid #0284c7',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <span style={{ color: '#0369a1', fontWeight: 'bold' }}>🔮 ¿Quizás quisiste decir:</span>
            <button
              onClick={() => {
                setNombre(sugerencia);
                buscarEnAPI(sugerencia);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontWeight: '800',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: 0
              }}
            >
              {sugerencia}
            </button>
            <span style={{ color: '#0369a1', fontWeight: 'bold' }}>?</span>
          </div>
        );
      }
      return null;
    })()}
  </div>
)}
```

---

### 3. Modificar `frontend/src/components/PageLayout.jsx` (Footer)

#### Cambiar el icono del footer por la Pokébola del proyecto (`icono_web_poke.png`)
Busca el elemento `<footer>` y modifica el div del título de **CARTATECA** para que renderice la imagen directamente desde la carpeta `public/` en vez de usar el emoji:

```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
    <img 
      src="/icono_web_poke.png" 
      alt="Cartateca Icon" 
      style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
    />
    <span style={{ fontWeight: '700', fontSize: '1rem', letterSpacing: '1px' }}>CARTATECA</span>
  </div>
  <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>© 2026 Todos los derechos reservados.</span>
</div>
```
