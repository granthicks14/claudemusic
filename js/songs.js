// ---------------------------------------------------------------------------
// Search for a song, get a YouTube link, build a beat in its style
// ---------------------------------------------------------------------------
// What this does and, more importantly, what it does not:
//
//   IT DOES   let you type a song name, find it, hand you a YouTube link to
//             the real recording, and configure the generator from that
//             song's tempo, genre and key so the beat you make sits in the
//             same pocket as the record you named.
//
//   IT DOES   NOT download, stream, decode or process a single sample of
//             that recording. The link opens YouTube in a new tab, which is
//             what a link is for. Pulling the audio down would breach
//             YouTube's terms of service and would not give anyone the right
//             to the recording anyway, so the program does not do it and
//             there is no hidden switch that makes it.
//
// The beat you end up with is therefore an ORIGINAL piece of music that
// shares a tempo and a key with something you like. Tempo and key are facts,
// not property - nobody owns 140 BPM in F minor - which is exactly why this
// version is buildable and the "make me an instrumental of this record" one
// is not.
//
// ---------------------------------------------------------------------------
// Why the catalogue is local
// ---------------------------------------------------------------------------
// A browser page with no server can only call an API that sends CORS
// headers. MusicBrainz - the obvious free choice - explicitly does not:
// their documentation states the API does not have CORS enabled, so a page
// like this one cannot read it, and no amount of wanting changes that.
// Shipping an API key for a commercial catalogue is not an option either,
// because a key in a static page is a published key.
//
// So the catalogue is here in the file. It is finite and it is honest about
// being finite: the search always falls back to sending whatever you typed
// straight to YouTube, so a song that is not listed still gets you a link -
// you just do not get the tempo hint with it.
//
// The tempo figures are reference values for well-documented recordings.
// Keys are given only where the recording has an unambiguous one, and left
// out otherwise rather than guessed at - a wrong key is worse than no key,
// because the program would build the whole beat around it. Everything is a
// starting point and every control stays editable afterwards.

const SONG_DB = [
  // --- Hip-hop -------------------------------------------------------------
  { t: "N.Y. State of Mind", a: "Nas", y: 1994, g: "hiphop", bpm: 88 },
  { t: "Juicy", a: "The Notorious B.I.G.", y: 1994, g: "hiphop", bpm: 95 },
  { t: "Dear Mama", a: "2Pac", y: 1995, g: "hiphop", bpm: 90 },
  { t: "Ms. Jackson", a: "OutKast", y: 2000, g: "hiphop", bpm: 95 },
  { t: "Still D.R.E.", a: "Dr. Dre ft. Snoop Dogg", y: 1999, g: "hiphop", bpm: 93 },
  { t: "Alright", a: "Kendrick Lamar", y: 2015, g: "hiphop", bpm: 110 },
  { t: "Runaway", a: "Kanye West", y: 2010, g: "hiphop", bpm: 87 },
  { t: "The Next Episode", a: "Dr. Dre ft. Snoop Dogg", y: 1999, g: "hiphop", bpm: 95 },
  { t: "C.R.E.A.M.", a: "Wu-Tang Clan", y: 1993, g: "hiphop", bpm: 88 },
  { t: "Passionfruit", a: "Drake", y: 2017, g: "hiphop", bpm: 111 },

  // --- Rap -----------------------------------------------------------------
  { t: "Lose Yourself", a: "Eminem", y: 2002, g: "rap", bpm: 171, key: "D", scale: "minor" },
  { t: "Rap God", a: "Eminem", y: 2013, g: "rap", bpm: 148 },
  { t: "Money Trees", a: "Kendrick Lamar", y: 2012, g: "rap", bpm: 143 },
  { t: "Look at Me!", a: "XXXTENTACION", y: 2017, g: "rap", bpm: 145 },
  { t: "Bodak Yellow", a: "Cardi B", y: 2017, g: "rap", bpm: 125 },
  { t: "Nonstop", a: "Drake", y: 2018, g: "rap", bpm: 154 },

  // --- Trap ----------------------------------------------------------------
  { t: "Mask Off", a: "Future", y: 2017, g: "trap", bpm: 150 },
  { t: "Bad and Boujee", a: "Migos", y: 2016, g: "trap", bpm: 127 },
  { t: "Goosebumps", a: "Travis Scott", y: 2016, g: "trap", bpm: 130 },
  { t: "XO Tour Llif3", a: "Lil Uzi Vert", y: 2017, g: "trap", bpm: 155 },
  { t: "rockstar", a: "Post Malone ft. 21 Savage", y: 2017, g: "trap", bpm: 160 },
  { t: "HUMBLE.", a: "Kendrick Lamar", y: 2017, g: "trap", bpm: 150 },
  { t: "SICKO MODE", a: "Travis Scott", y: 2018, g: "trap", bpm: 155 },
  { t: "Life Is Good", a: "Future ft. Drake", y: 2020, g: "trap", bpm: 142 },

  // --- Drill ---------------------------------------------------------------
  { t: "Welcome to the Party", a: "Pop Smoke", y: 2019, g: "drill", bpm: 140 },
  { t: "Dior", a: "Pop Smoke", y: 2019, g: "drill", bpm: 150 },
  { t: "Body", a: "Russ Millions & Tion Wayne", y: 2021, g: "drill", bpm: 143 },
  { t: "Gang Gang", a: "Headie One", y: 2019, g: "drill", bpm: 142 },

  // --- Phonk ---------------------------------------------------------------
  { t: "Murder in My Mind", a: "Kordhell", y: 2022, g: "phonk", bpm: 155 },
  { t: "Metamorphosis", a: "INTERWORLD", y: 2021, g: "phonk", bpm: 145 },
  { t: "Sahara", a: "Hensonn", y: 2022, g: "phonk", bpm: 130 },
  { t: "Slob on My Knob", a: "Three 6 Mafia", y: 1999, g: "phonk", bpm: 140 },

  // --- Jersey club ---------------------------------------------------------
  { t: "Just Wanna Rock", a: "Lil Uzi Vert", y: 2022, g: "jerseyclub", bpm: 145 },
  { t: "Tempo", a: "DJ Sliink", y: 2013, g: "jerseyclub", bpm: 140 },
  { t: "Feels Like", a: "DJ Smallz 732", y: 2021, g: "jerseyclub", bpm: 140 },

  // --- R&B -----------------------------------------------------------------
  { t: "No Scrubs", a: "TLC", y: 1999, g: "rnb", bpm: 93 },
  { t: "Say My Name", a: "Destiny's Child", y: 1999, g: "rnb", bpm: 138 },
  { t: "Adorn", a: "Miguel", y: 2012, g: "rnb", bpm: 89 },
  { t: "Best Part", a: "Daniel Caesar ft. H.E.R.", y: 2017, g: "rnb", bpm: 71 },
  { t: "Come Through and Chill", a: "Miguel", y: 2017, g: "rnb", bpm: 92 },
  { t: "Snooze", a: "SZA", y: 2022, g: "rnb", bpm: 143 },
  { t: "Earned It", a: "The Weeknd", y: 2015, g: "rnb", bpm: 61 },

  // --- Neo-soul ------------------------------------------------------------
  { t: "Brown Sugar", a: "D'Angelo", y: 1995, g: "neosoul", bpm: 92 },
  { t: "Untitled (How Does It Feel)", a: "D'Angelo", y: 2000, g: "neosoul", bpm: 82 },
  { t: "On & On", a: "Erykah Badu", y: 1997, g: "neosoul", bpm: 90 },
  { t: "Didn't Cha Know", a: "Erykah Badu", y: 2000, g: "neosoul", bpm: 88 },
  { t: "The Light", a: "Common", y: 2000, g: "neosoul", bpm: 90 },
  { t: "Cranes in the Sky", a: "Solange", y: 2016, g: "neosoul", bpm: 76 },
  { t: "Redbone", a: "Childish Gambino", y: 2016, g: "neosoul", bpm: 80 },

  // --- Lo-fi ---------------------------------------------------------------
  { t: "Feather", a: "Nujabes ft. Cise Starr & Akin", y: 2005, g: "lofi", bpm: 88 },
  { t: "Aruarian Dance", a: "Nujabes", y: 2004, g: "lofi", bpm: 90 },
  { t: "Luv(sic) Part 3", a: "Nujabes ft. Shing02", y: 2005, g: "lofi", bpm: 92 },
  { t: "Don't Cry", a: "J Dilla", y: 2006, g: "lofi", bpm: 92 },
  { t: "Nautilus", a: "Bob James", y: 1974, g: "lofi", bpm: 92 },

  // --- House ---------------------------------------------------------------
  { t: "Show Me Love", a: "Robin S", y: 1993, g: "house", bpm: 120 },
  { t: "Music Sounds Better with You", a: "Stardust", y: 1998, g: "house", bpm: 124 },
  { t: "One More Time", a: "Daft Punk", y: 2000, g: "house", bpm: 123 },
  { t: "Your Love", a: "Frankie Knuckles", y: 1987, g: "house", bpm: 120 },
  { t: "Gypsy Woman (She's Homeless)", a: "Crystal Waters", y: 1991, g: "house", bpm: 122 },
  { t: "Losing It", a: "FISHER", y: 2018, g: "house", bpm: 125 },
  { t: "Finally", a: "CeCe Peniston", y: 1991, g: "house", bpm: 120 },

  // --- Techno --------------------------------------------------------------
  { t: "Strings of Life", a: "Derrick May", y: 1987, g: "techno", bpm: 120 },
  { t: "Spastik", a: "Plastikman", y: 1993, g: "techno", bpm: 128 },
  { t: "The Bells", a: "Jeff Mills", y: 1997, g: "techno", bpm: 135 },
  { t: "Rej", a: "Âme", y: 2005, g: "techno", bpm: 124 },
  { t: "No UFO's", a: "Model 500", y: 1985, g: "techno", bpm: 122 },

  // --- Drum and bass -------------------------------------------------------
  { t: "Inner City Life", a: "Goldie", y: 1994, g: "dnb", bpm: 170 },
  { t: "Original Nuttah", a: "UK Apache & Shy FX", y: 1994, g: "dnb", bpm: 172 },
  { t: "Brown Paper Bag", a: "Roni Size / Reprazent", y: 1997, g: "dnb", bpm: 170 },
  { t: "Circles", a: "Adam F", y: 1997, g: "dnb", bpm: 174 },
  { t: "Bambaataa", a: "Shy FX", y: 2002, g: "dnb", bpm: 174 },

  // --- Dubstep -------------------------------------------------------------
  { t: "Scary Monsters and Nice Sprites", a: "Skrillex", y: 2010, g: "dubstep", bpm: 140 },
  { t: "Midnight Request Line", a: "Skream", y: 2005, g: "dubstep", bpm: 138 },
  { t: "Anti-War Dub", a: "Digital Mystikz", y: 2006, g: "dubstep", bpm: 140 },
  { t: "Cockney Thug", a: "Rusko", y: 2007, g: "dubstep", bpm: 140 },
  { t: "Eastern Jam", a: "Chase & Status", y: 2008, g: "dubstep", bpm: 140 },

  // --- UK garage -----------------------------------------------------------
  { t: "Re-Rewind", a: "Artful Dodger ft. Craig David", y: 1999, g: "ukgarage", bpm: 132 },
  { t: "Flowers", a: "Sweet Female Attitude", y: 2000, g: "ukgarage", bpm: 133 },
  { t: "Do You Really Like It?", a: "DJ Pied Piper & the Masters of Ceremonies", y: 2001, g: "ukgarage", bpm: 135 },
  { t: "Little Man", a: "Sia / Wookie remix", y: 2000, g: "ukgarage", bpm: 134 },

  // --- Reggaeton -----------------------------------------------------------
  { t: "Gasolina", a: "Daddy Yankee", y: 2004, g: "reggaeton", bpm: 95 },
  { t: "Despacito", a: "Luis Fonsi ft. Daddy Yankee", y: 2017, g: "reggaeton", bpm: 89, key: "B", scale: "minor" },
  { t: "Con Calma", a: "Daddy Yankee ft. Snow", y: 2019, g: "reggaeton", bpm: 94 },
  { t: "Dákiti", a: "Bad Bunny & Jhay Cortez", y: 2020, g: "reggaeton", bpm: 110 },
  { t: "Tití Me Preguntó", a: "Bad Bunny", y: 2022, g: "reggaeton", bpm: 106 },
  { t: "Danza Kuduro", a: "Don Omar & Lucenzo", y: 2010, g: "reggaeton", bpm: 130 },

  // --- Afrobeats -----------------------------------------------------------
  { t: "Essence", a: "WizKid ft. Tems", y: 2020, g: "afrobeats", bpm: 106 },
  { t: "Ye", a: "Burna Boy", y: 2018, g: "afrobeats", bpm: 105 },
  { t: "Last Last", a: "Burna Boy", y: 2022, g: "afrobeats", bpm: 105 },
  { t: "Fall", a: "Davido", y: 2017, g: "afrobeats", bpm: 106 },
  { t: "Calm Down", a: "Rema", y: 2022, g: "afrobeats", bpm: 107 },
  { t: "On the Low", a: "Burna Boy", y: 2018, g: "afrobeats", bpm: 100 },

  // --- Amapiano ------------------------------------------------------------
  { t: "Ke Star", a: "Focalistic & Vigro Deep", y: 2020, g: "amapiano", bpm: 112 },
  { t: "Adiwele", a: "Young Stunna & Kabza De Small", y: 2021, g: "amapiano", bpm: 112 },
  { t: "Sponono", a: "Kabza De Small ft. Wizkid", y: 2020, g: "amapiano", bpm: 112 },
  { t: "Emcimbini", a: "Kabza De Small & DJ Maphorisa", y: 2020, g: "amapiano", bpm: 113 },

  // --- Synthwave -----------------------------------------------------------
  { t: "Nightcall", a: "Kavinsky", y: 2010, g: "synthwave", bpm: 100, key: "F#", scale: "minor" },
  { t: "A Real Hero", a: "College & Electric Youth", y: 2010, g: "synthwave", bpm: 118 },
  { t: "Turbo Killer", a: "Carpenter Brut", y: 2016, g: "synthwave", bpm: 130 },
  { t: "Resonance", a: "HOME", y: 2014, g: "synthwave", bpm: 110 },
  { t: "Sunset", a: "The Midnight", y: 2016, g: "synthwave", bpm: 105 },

  // --- Rock ----------------------------------------------------------------
  { t: "Smells Like Teen Spirit", a: "Nirvana", y: 1991, g: "rock", bpm: 117, key: "F", scale: "minor" },
  { t: "Seven Nation Army", a: "The White Stripes", y: 2003, g: "rock", bpm: 124, key: "E", scale: "minor" },
  { t: "Back in Black", a: "AC/DC", y: 1980, g: "rock", bpm: 94, key: "E", scale: "major" },
  { t: "Everlong", a: "Foo Fighters", y: 1997, g: "rock", bpm: 158, key: "D", scale: "major" },
  { t: "Come as You Are", a: "Nirvana", y: 1991, g: "rock", bpm: 120 },
  { t: "Killing in the Name", a: "Rage Against the Machine", y: 1992, g: "rock", bpm: 87 },
  { t: "Song 2", a: "Blur", y: 1997, g: "rock", bpm: 130 },
  { t: "My Hero", a: "Foo Fighters", y: 1997, g: "rock", bpm: 148 },

  // --- Round 12: a second pass, weighted to the thin genres ----------------
  // Jersey club had three entries, drill and UK garage four. A genre with a
  // handful of references is a genre where the search mostly misses.

  // --- Hip-hop -------------------------------------------------------------
  { t: "Shook Ones, Pt. II", a: "Mobb Deep", y: 1995, g: "hiphop", bpm: 91 },
  { t: "Rosa Parks", a: "OutKast", y: 1998, g: "hiphop", bpm: 96 },
  { t: "Award Tour", a: "A Tribe Called Quest", y: 1993, g: "hiphop", bpm: 96 },
  { t: "They Reminisce Over You", a: "Pete Rock & CL Smooth", y: 1992, g: "hiphop", bpm: 92 },
  { t: "Devil in a New Dress", a: "Kanye West", y: 2010, g: "hiphop", bpm: 92 },
  { t: "Jesus Walks", a: "Kanye West", y: 2004, g: "hiphop", bpm: 87 },
  { t: "Sing About Me", a: "Kendrick Lamar", y: 2012, g: "hiphop", bpm: 84 },
  { t: "Nikes", a: "Frank Ocean", y: 2016, g: "hiphop", bpm: 86 },
  { t: "Simple Things", a: "Miguel", y: 2015, g: "hiphop", bpm: 94 },
  { t: "Electric Relaxation", a: "A Tribe Called Quest", y: 1993, g: "hiphop", bpm: 94 },

  // --- Rap -----------------------------------------------------------------
  { t: "In Da Club", a: "50 Cent", y: 2003, g: "rap", bpm: 90 },
  { t: "Forgot About Dre", a: "Dr. Dre ft. Eminem", y: 1999, g: "rap", bpm: 134 },
  { t: "Hard Knock Life", a: "JAY-Z", y: 1998, g: "rap", bpm: 92 },
  { t: "Big Poppa", a: "The Notorious B.I.G.", y: 1994, g: "rap", bpm: 84 },
  { t: "Panda", a: "Desiigner", y: 2016, g: "rap", bpm: 152 },
  { t: "First Person Shooter", a: "Drake ft. J. Cole", y: 2023, g: "rap", bpm: 138 },
  { t: "Not Like Us", a: "Kendrick Lamar", y: 2024, g: "rap", bpm: 101 },
  { t: "Family Ties", a: "Baby Keem & Kendrick Lamar", y: 2021, g: "rap", bpm: 148 },

  // --- Trap ----------------------------------------------------------------
  { t: "Antidote", a: "Travis Scott", y: 2015, g: "trap", bpm: 130 },
  { t: "Jumpman", a: "Drake & Future", y: 2015, g: "trap", bpm: 143 },
  { t: "T-Shirt", a: "Migos", y: 2017, g: "trap", bpm: 140 },
  { t: "Gucci Gang", a: "Lil Pump", y: 2017, g: "trap", bpm: 122 },
  { t: "Lucid Dreams", a: "Juice WRLD", y: 2018, g: "trap", bpm: 84 },
  { t: "Money So Big", a: "Yeat", y: 2021, g: "trap", bpm: 140 },
  { t: "Type Shit", a: "Future & Metro Boomin", y: 2024, g: "trap", bpm: 130 },
  { t: "Knife Talk", a: "Drake ft. 21 Savage", y: 2021, g: "trap", bpm: 145 },

  // --- Drill ---------------------------------------------------------------
  { t: "Sticky", a: "Drake", y: 2022, g: "drill", bpm: 142 },
  { t: "Doja", a: "Central Cee", y: 2022, g: "drill", bpm: 140 },
  { t: "Obsessed with You", a: "Central Cee", y: 2021, g: "drill", bpm: 143 },
  { t: "Mmm Mmm", a: "Digga D", y: 2021, g: "drill", bpm: 141 },
  { t: "For a Fee", a: "Headie One", y: 2020, g: "drill", bpm: 142 },
  { t: "The Woo", a: "Pop Smoke ft. 50 Cent", y: 2020, g: "drill", bpm: 142 },
  { t: "Hello", a: "Pop Smoke", y: 2020, g: "drill", bpm: 145 },
  { t: "Trap Phone", a: "Fivio Foreign", y: 2021, g: "drill", bpm: 140 },

  // --- Phonk ---------------------------------------------------------------
  { t: "Close Eyes", a: "DVRST", y: 2021, g: "phonk", bpm: 140 },
  { t: "Shadow", a: "LXNGVX", y: 2022, g: "phonk", bpm: 145 },
  { t: "Vendetta", a: "KSLV Noh", y: 2022, g: "phonk", bpm: 150 },
  { t: "Rave", a: "Dxrk", y: 2022, g: "phonk", bpm: 160 },
  { t: "Tell Me Why", a: "Freddie Dredd", y: 2019, g: "phonk", bpm: 135 },
  { t: "Sweet Dreams", a: "Kordhell", y: 2022, g: "phonk", bpm: 152 },

  // --- Jersey club ---------------------------------------------------------
  { t: "Wanna Be", a: "GloRilla & Megan Thee Stallion", y: 2024, g: "jerseyclub", bpm: 140 },
  { t: "Act Up", a: "Cookiee Kawaii", y: 2019, g: "jerseyclub", bpm: 140 },
  { t: "Vibe (If I Back It Up)", a: "Cookiee Kawaii", y: 2019, g: "jerseyclub", bpm: 140 },
  { t: "Pretty Girls Walk", a: "Big Boss Vette", y: 2023, g: "jerseyclub", bpm: 142 },
  { t: "Left Cheek Right Cheek", a: "DJ Sliink", y: 2015, g: "jerseyclub", bpm: 140 },
  { t: "Sensational", a: "Bandmanrill", y: 2022, g: "jerseyclub", bpm: 145 },
  { t: "Heartbroken", a: "Lil Uzi Vert", y: 2023, g: "jerseyclub", bpm: 143 },

  // --- R&B -----------------------------------------------------------------
  { t: "Pony", a: "Ginuwine", y: 1996, g: "rnb", bpm: 92 },
  { t: "Are You That Somebody?", a: "Aaliyah", y: 1998, g: "rnb", bpm: 96 },
  { t: "Crazy in Love", a: "Beyonce", y: 2003, g: "rnb", bpm: 99 },
  { t: "Kill Bill", a: "SZA", y: 2022, g: "rnb", bpm: 89 },
  { t: "Good Days", a: "SZA", y: 2020, g: "rnb", bpm: 121 },
  { t: "Location", a: "Khalid", y: 2016, g: "rnb", bpm: 100 },
  { t: "Thinkin Bout You", a: "Frank Ocean", y: 2012, g: "rnb", bpm: 132 },

  // --- Neo-soul ------------------------------------------------------------
  { t: "Bag Lady", a: "Erykah Badu", y: 2000, g: "neosoul", bpm: 88 },
  { t: "Ex-Factor", a: "Lauryn Hill", y: 1998, g: "neosoul", bpm: 88 },
  { t: "Doo Wop (That Thing)", a: "Lauryn Hill", y: 1998, g: "neosoul", bpm: 100 },
  { t: "Devil May Cry", a: "The Weeknd", y: 2013, g: "neosoul", bpm: 78 },
  { t: "Nothing Even Matters", a: "Lauryn Hill & D'Angelo", y: 1998, g: "neosoul", bpm: 76 },
  { t: "Come Home", a: "Anderson .Paak", y: 2018, g: "neosoul", bpm: 94 },
  { t: "Sunday Morning", a: "Erykah Badu", y: 2003, g: "neosoul", bpm: 84 },

  // --- Lo-fi ---------------------------------------------------------------
  { t: "Kaoru Nagisa", a: "Nujabes", y: 2004, g: "lofi", bpm: 88 },
  { t: "Time Travel", a: "Nujabes", y: 2003, g: "lofi", bpm: 86 },
  { t: "Antiquity", a: "Nujabes", y: 2005, g: "lofi", bpm: 90 },
  { t: "Two Can Win", a: "J Dilla", y: 2006, g: "lofi", bpm: 88 },
  { t: "Workinonit", a: "J Dilla", y: 2006, g: "lofi", bpm: 96 },
  { t: "Affection", a: "Jinsang", y: 2016, g: "lofi", bpm: 82 },
  { t: "Coffee", a: "Idealism", y: 2017, g: "lofi", bpm: 78 },

  // --- House ---------------------------------------------------------------
  { t: "Deep Inside", a: "Hardrive", y: 1993, g: "house", bpm: 122 },
  { t: "Can You Feel It", a: "Mr. Fingers", y: 1986, g: "house", bpm: 120 },
  { t: "Percolator", a: "Cajmere", y: 1992, g: "house", bpm: 124 },
  { t: "Where Love Lives", a: "Alison Limerick", y: 1990, g: "house", bpm: 122 },
  { t: "Around the World", a: "Daft Punk", y: 1997, g: "house", bpm: 121 },
  { t: "Sandstorm", a: "Darude", y: 1999, g: "house", bpm: 136 },
  { t: "Bad Habit", a: "The Kid LAROI"  , y: 2022, g: "house", bpm: 124 },
  { t: "Rumble", a: "Skrillex, Fred again.. & Flowdan", y: 2023, g: "house", bpm: 140 },

  // --- Techno --------------------------------------------------------------
  { t: "Acid Tracks", a: "Phuture", y: 1987, g: "techno", bpm: 122 },
  { t: "Energy Flash", a: "Joey Beltram", y: 1990, g: "techno", bpm: 128 },
  { t: "Domina", a: "Charlotte de Witte", y: 2019, g: "techno", bpm: 134 },
  { t: "Hypnotized", a: "Adam Beyer", y: 2018, g: "techno", bpm: 128 },
  { t: "Sonic Destroyer", a: "X-101", y: 1991, g: "techno", bpm: 130 },
  { t: "Knights of the Jaguar", a: "DJ Rolando", y: 1999, g: "techno", bpm: 132 },

  // --- Drum and bass -------------------------------------------------------
  { t: "Pulp Fiction", a: "Alex Reece", y: 1995, g: "dnb", bpm: 170 },
  { t: "Terminator", a: "Metalheadz / Goldie", y: 1992, g: "dnb", bpm: 165 },
  { t: "Valley of the Shadows", a: "Origin Unknown", y: 1993, g: "dnb", bpm: 170 },
  { t: "Warm Up", a: "Netsky", y: 2010, g: "dnb", bpm: 174 },
  { t: "Turn Back Time", a: "Sub Focus", y: 2009, g: "dnb", bpm: 174 },
  { t: "Tarantula", a: "Pendulum", y: 2005, g: "dnb", bpm: 174 },
  { t: "Heartbeat Loud", a: "Chase & Status", y: 2019, g: "dnb", bpm: 174 },

  // --- Dubstep -------------------------------------------------------------
  { t: "Bass Cannon", a: "Flux Pavilion", y: 2011, g: "dubstep", bpm: 140 },
  { t: "I Can't Stop", a: "Flux Pavilion", y: 2010, g: "dubstep", bpm: 140 },
  { t: "Cracks (Flux Pavilion Remix)", a: "Freestylers", y: 2010, g: "dubstep", bpm: 140 },
  { t: "Archangel", a: "Burial", y: 2007, g: "dubstep", bpm: 138 },
  { t: "Night", a: "Benga & Coki", y: 2007, g: "dubstep", bpm: 140 },
  { t: "Where's My Money", a: "Skrillex / TC", y: 2011, g: "dubstep", bpm: 140 },

  // --- UK garage -----------------------------------------------------------
  { t: "Sweet Like Chocolate", a: "Shanks & Bigfoot", y: 1999, g: "ukgarage", bpm: 133 },
  { t: "Movin' Too Fast", a: "Artful Dodger & Romina Johnson", y: 2000, g: "ukgarage", bpm: 134 },
  { t: "Body Groove", a: "Architechs", y: 2000, g: "ukgarage", bpm: 132 },
  { t: "Battle", a: "Wookie", y: 2000, g: "ukgarage", bpm: 134 },
  { t: "Baby Cakes", a: "3 of a Kind", y: 2004, g: "ukgarage", bpm: 136 },
  { t: "Latch", a: "Disclosure ft. Sam Smith", y: 2012, g: "ukgarage", bpm: 122 },
  { t: "White Noise", a: "Disclosure ft. AlunaGeorge", y: 2013, g: "ukgarage", bpm: 122 },

  // --- Reggaeton -----------------------------------------------------------
  { t: "Safaera", a: "Bad Bunny", y: 2020, g: "reggaeton", bpm: 94 },
  { t: "Yo Perreo Sola", a: "Bad Bunny", y: 2020, g: "reggaeton", bpm: 90 },
  { t: "Hey Mor", a: "Ozuna & Feid", y: 2022, g: "reggaeton", bpm: 92 },
  { t: "Pepas", a: "Farruko", y: 2021, g: "reggaeton", bpm: 130 },
  { t: "Mia", a: "Bad Bunny ft. Drake", y: 2018, g: "reggaeton", bpm: 97 },
  { t: "Provenza", a: "Karol G", y: 2022, g: "reggaeton", bpm: 111 },
  { t: "La Modelo", a: "Ozuna & Cardi B", y: 2017, g: "reggaeton", bpm: 96 },

  // --- Afrobeats -----------------------------------------------------------
  { t: "Soco", a: "Wizkid", y: 2018, g: "afrobeats", bpm: 105 },
  { t: "Come Closer", a: "Wizkid ft. Drake", y: 2017, g: "afrobeats", bpm: 104 },
  { t: "Peru", a: "Fireboy DML", y: 2021, g: "afrobeats", bpm: 106 },
  { t: "Unavailable", a: "Davido ft. Musa Keys", y: 2023, g: "afrobeats", bpm: 108 },
  { t: "Rush", a: "Ayra Starr", y: 2022, g: "afrobeats", bpm: 106 },
  { t: "Kilometre", a: "Burna Boy", y: 2021, g: "afrobeats", bpm: 104 },
  { t: "Water", a: "Tyla", y: 2023, g: "afrobeats", bpm: 116 },

  // --- Amapiano ------------------------------------------------------------
  { t: "Woza", a: "Mr JazziQ & Lady Du", y: 2021, g: "amapiano", bpm: 112 },
  { t: "Umlando", a: "9umba, Toss & Mdoovar", y: 2022, g: "amapiano", bpm: 112 },
  { t: "Mnike", a: "Tyler ICU & Tumelo.za", y: 2023, g: "amapiano", bpm: 113 },
  { t: "Asibe Happy", a: "Kabza De Small & Ami Faku", y: 2022, g: "amapiano", bpm: 112 },
  { t: "Bopha", a: "Zakes Bantwini & Nomcebo", y: 2022, g: "amapiano", bpm: 112 },
  { t: "Iplan", a: "TitoM & Yuppe", y: 2023, g: "amapiano", bpm: 113 },

  // --- Synthwave -----------------------------------------------------------
  { t: "Miami Disco", a: "Kavinsky", y: 2010, g: "synthwave", bpm: 118 },
  { t: "Blade Runner", a: "Vangelis", y: 1982, g: "synthwave", bpm: 100 },
  { t: "Le Redoutable", a: "Carpenter Brut", y: 2015, g: "synthwave", bpm: 128 },
  { t: "Deadcruiser", a: "Perturbator", y: 2014, g: "synthwave", bpm: 130 },
  { t: "Tech Noir", a: "Gunship", y: 2015, g: "synthwave", bpm: 112 },
  { t: "Los Angeles", a: "The Midnight", y: 2018, g: "synthwave", bpm: 108 },
  { t: "Brain", a: "Com Truise", y: 2011, g: "synthwave", bpm: 100 },

  // --- Rock ----------------------------------------------------------------
  { t: "Enter Sandman", a: "Metallica", y: 1991, g: "rock", bpm: 123 },
  { t: "Sweet Child O' Mine", a: "Guns N' Roses", y: 1987, g: "rock", bpm: 125 },
  { t: "Basket Case", a: "Green Day", y: 1994, g: "rock", bpm: 170 },
  { t: "In Bloom", a: "Nirvana", y: 1991, g: "rock", bpm: 78 },
  { t: "The Pretender", a: "Foo Fighters", y: 2007, g: "rock", bpm: 172 },
  { t: "Do I Wanna Know?", a: "Arctic Monkeys", y: 2013, g: "rock", bpm: 85 },
  { t: "R U Mine?", a: "Arctic Monkeys", y: 2012, g: "rock", bpm: 100 },
  { t: "Paranoid", a: "Black Sabbath", y: 1970, g: "rock", bpm: 164 },
  { t: "Are You Gonna Be My Girl", a: "Jet", y: 2003, g: "rock", bpm: 106 },
];

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------
// Ranked substring matching over title and artist. Deliberately simple and
// deliberately forgiving: people type "teen spirit" and "nirvana teen
// spirit" and "smells like", and all three should find the record.
function normalise(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    // Strip accents so "Titi Me Pregunto" finds "Tití Me Preguntó".
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchSongs(query, limit = 8) {
  const q = normalise(query);
  if (!q) return [];
  const words = q.split(" ");
  const scored = [];
  for (const s of SONG_DB) {
    const title = normalise(s.t);
    const artist = normalise(s.a);
    const hay = `${title} ${artist}`;
    let score = 0;
    // Whole-query hits are worth far more than scattered word hits, so
    // "seven nation army" beats a song that merely contains "army".
    if (title === q) score += 120;
    else if (title.startsWith(q)) score += 80;
    else if (title.includes(q)) score += 60;
    if (artist === q) score += 50;
    else if (artist.includes(q)) score += 30;
    let hit = 0;
    for (const w of words) {
      if (!w) continue;
      if (title.includes(w)) { score += 10; hit++; }
      else if (artist.includes(w)) { score += 7; hit++; }
    }
    // Every word has to land somewhere, otherwise "nirvana teen spirit"
    // would match anything by Nirvana equally well.
    if (hit < words.length) score -= (words.length - hit) * 12;
    if (score > 0) scored.push({ song: s, score });
  }
  scored.sort((a, b) => b.score - a.score || a.song.t.localeCompare(b.song.t));
  return scored.slice(0, limit).map((x) => x.song);
}

// ---------------------------------------------------------------------------
// The YouTube link
// ---------------------------------------------------------------------------
// A search URL, not a video ID. Resolving a query to one specific video
// needs the YouTube Data API, which needs a key, and a key embedded in a
// static page is a published key - anyone can read it and spend the owner's
// quota. So the link goes to YouTube's own results page for the exact title
// and artist, which lands on the record as the first hit and, unlike a
// hardcoded video ID, does not rot when a video is taken down or re-uploaded.
function youtubeSearchUrl(song) {
  const q = typeof song === "string" ? song : `${song.a} ${song.t}`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

// If the user brings their OWN YouTube Data API key, the exact video can be
// resolved. This is opt-in, the key stays in their browser, and everything
// works without it - it just gives a direct watch link and the real title
// instead of a search page.
async function youtubeResolve(song, apiKey) {
  if (!apiKey) return null;
  const q = typeof song === "string" ? song : `${song.a} ${song.t}`;
  const url = "https://www.googleapis.com/youtube/v3/search"
    + "?part=snippet&type=video&maxResults=1"
    + `&q=${encodeURIComponent(q)}&key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube API returned ${res.status}`);
  const data = await res.json();
  const item = data.items && data.items[0];
  if (!item) return null;
  return {
    videoId: item.id.videoId,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
  };
}

// ---------------------------------------------------------------------------
// Turning a song into generator settings
// ---------------------------------------------------------------------------
// Only tempo, genre and (where known) key cross over. Nothing about the
// recording itself does, because nothing about the recording is here.
function songToStyleSettings(song, styles) {
  const out = { bpm: song.bpm, genre: song.g };
  if (styles && !styles[song.g]) out.genre = null;   // genre retired or renamed
  if (song.key) out.key = song.key + "2";
  if (song.scale) out.scale = song.scale;
  return out;
}

// A line the UI can show that makes the relationship explicit, so nobody is
// left thinking the program has the record.
function songCreditLine(song) {
  return `Reference: “${song.t}” — ${song.a} (${song.y}). `
    + `Your beat is built at ${song.bpm} BPM in the ${song.g} style. `
    + `It contains no audio from that recording.`;
}

// Fail loudly on a malformed table rather than generating silence.
function normaliseSongDb() {
  for (const s of SONG_DB) {
    if (!s.t || !s.a || !(s.bpm > 30 && s.bpm < 260)) {
      throw new Error(`Bad song entry: ${JSON.stringify(s)}`);
    }
  }
  return SONG_DB.length;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    SONG_DB, searchSongs, youtubeSearchUrl, youtubeResolve,
    songToStyleSettings, songCreditLine, normaliseSongDb, normalise,
  };
}
