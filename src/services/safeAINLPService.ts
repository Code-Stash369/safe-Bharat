import { SafeAIActionType, UserProfile, LocationInfo } from '../types';

export interface SafeAIAnalysisResult {
  reply: string;
  isEmergency: boolean;
  situationCategory: string;
  suggestedActions: SafeAIActionType[];
  actionCommand: SafeAIActionType | null;
  interpretedIntent?: string;
}

// Levenshtein distance for fuzzy typo comparison
function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Check if any word in the text fuzzily matches any target keyword
function fuzzyMatches(textTokens: string[], keywords: string[], maxDistance = 2): boolean {
  for (const token of textTokens) {
    if (token.length < 3) {
      if (keywords.includes(token)) return true;
      continue;
    }
    for (const kw of keywords) {
      if (kw === token) return true;
      if (Math.abs(token.length - kw.length) > maxDistance) continue;
      const dist = levenshteinDistance(token, kw);
      const allowed = kw.length <= 4 ? 1 : maxDistance;
      if (dist <= allowed) return true;
    }
  }
  return false;
}

// Normalize and tokenize text, stripping noise characters
function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

export function processSafeAIPrompt(
  rawInput: string,
  context?: {
    user?: UserProfile;
    location?: LocationInfo | null;
    isSirenActive?: boolean;
  }
): SafeAIAnalysisResult {
  const input = rawInput.trim();
  const lower = input.toLowerCase();
  const tokens = tokenize(lower);
  const user = context?.user;
  const location = context?.location;
  const isSirenActive = context?.isSirenActive ?? false;

  const contactName = user?.contacts?.[0]?.name || 'Pre-Saved Family Contact';
  const coordsStr = location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Live GPS';

  // 1. STOP SIREN / DEACTIVATE DRILL
  if (
    lower.includes('stop siren') ||
    lower.includes('siren band') ||
    lower.includes('siren off') ||
    lower.includes('stop alarm') ||
    lower.includes('alarm band') ||
    lower.includes('band karo') ||
    lower.includes('shant karo') ||
    fuzzyMatches(tokens, ['stopsiren', 'sirenband', 'alarmoff'])
  ) {
    return {
      reply: `🔇 Siren alarm drill deactivated. Your audio beacon has been silenced.\n\n• Stay aware of your surroundings.\n• Tap 'Share Live Location' if you still need family to track you.`,
      isEmergency: false,
      situationCategory: 'siren_control',
      suggestedActions: ['STOP_SIREN', 'SHARE_LOCATION', 'CALL_CONTACT'],
      actionCommand: 'STOP_SIREN',
      interpretedIntent: 'Stop Siren Drill',
    };
  }

  // 2. IMMEDIATE DANGER / SOS / HELP / BACHAO (Heavy typo tolerance)
  const dangerKeywords = [
    'danger', 'dngr', 'dangar', 'danzer', 'khatra', 'khtra', 'khatre', 'bachao', 'bchao', 'bchaoo',
    'help', 'hlp', 'heelp', 'hepl', 'hlep', 'madad', 'maddad', 'sos', 'saveme', 'maro', 'attack',
    'hamla', 'gunda', 'trouble', 'emergency', 'imrdency', 'emrgncy'
  ];
  if (
    lower.includes('in danger') ||
    lower.includes('bachao') ||
    lower.includes('help me') ||
    lower.includes('khatre me') ||
    lower.includes('khatra') ||
    fuzzyMatches(tokens, dangerKeywords)
  ) {
    return {
      reply: `🚨 **EMERGENCY ASSISTANCE ACTIVATED (Recognized Distress Call)**\n\n1. **Move Toward Safety**: Head immediately toward open shops, guards, crowds, or fuel pumps.\n2. **Emergency Beacon Triggered**: Loud SOS siren & SMS with GPS coords (${coordsStr}) prepared.\n3. **Call For Backup**: Tap below to immediately ring 112 Universal Rescue or your family contact.`,
      isEmergency: true,
      situationCategory: 'immediate_danger',
      suggestedActions: ['TRIGGER_SOS', 'CALL_112', 'SHARE_LOCATION', 'WHATSAPP_SOS', 'CALL_CONTACT', 'OPEN_CAMERA'],
      actionCommand: 'TRIGGER_SOS',
      interpretedIntent: 'Critical Emergency / SOS Distress',
    };
  }

  // 3. FOLLOWING / STALKING / SUSPICIOUS PERSON (Typos: folow, stlk, picha, piche)
  const followingKeywords = [
    'following', 'folow', 'folowing', 'folwing', 'follwing', 'follw', 'stalk', 'stalke', 'stalker',
    'stlk', 'picha', 'peecha', 'piche', 'picha', 'peche', 'behind', 'chasing', 'chase', 'shady'
  ];
  if (
    lower.includes('someone is following') ||
    lower.includes('picha kar raha') ||
    lower.includes('peecha kar raha') ||
    lower.includes('behind me') ||
    fuzzyMatches(tokens, followingKeywords)
  ) {
    return {
      reply: `👀 **STALKING / FOLLOWING PROTOCOL ENGAGED**\n\n1. **Do NOT Go Home or into Empty Alleys**: Enter the nearest well-lit public space (metro station, hotel lobby, busy store).\n2. **Simulate a Call**: Tap 'Trigger Fake Call' below to pretend you are talking to someone waiting for you right ahead.\n3. **Broadcast Location**: Dispatch your live GPS coordinates to family via SMS or WhatsApp.\n4. **If Approached**: Shout "BACK OFF!" loudly to attract public attention and dial 112.`,
      isEmergency: true,
      situationCategory: 'following_stalking',
      suggestedActions: ['FAKE_CALL', 'SHARE_LOCATION', 'WHATSAPP_SOS', 'CALL_112', 'FIND_SAFE_PLACES', 'START_ESCORT'],
      actionCommand: 'FAKE_CALL',
      interpretedIntent: 'Following & Stalking Evasion',
    };
  }

  // 4. HARASSMENT / EVE TEASING / WOMEN SAFETY / SAKHI 181
  const harassmentKeywords = [
    'harass', 'haras', 'harasment', 'hras', 'molest', 'molestation', 'eveteasing', 'chhedkhani',
    'chhed', 'chhedna', 'badtouch', 'comment', 'stalking', 'dhamki', 'threat', 'trolling', 'blackmail'
  ];
  if (
    lower.includes('harass') ||
    lower.includes('chhed') ||
    lower.includes('eve teasing') ||
    lower.includes('molest') ||
    lower.includes('dhamki') ||
    lower.includes('181') ||
    fuzzyMatches(tokens, harassmentKeywords)
  ) {
    return {
      reply: `🛡️ **WOMEN SAFETY PROTOCOL (181 SAKHI & 112 DISPATCH)**\n\n1. **You Are Safe With Us**: This is not your fault. Do not engage or escalate.\n2. **Call 181 / 112**: Sakhi One-Stop Center provides instant police rescue and legal support.\n3. **Record Evidence Discretely**: Use 'Open Evidence Camera' or 'Record Audio' without putting yourself in danger.\n4. **Share Live Track**: Send real-time tracking to your trusted circle.`,
      isEmergency: true,
      situationCategory: 'harassment',
      suggestedActions: ['CALL_181', 'CALL_112', 'SHARE_LOCATION', 'OPEN_CAMERA', 'RECORD_AUDIO', 'CALL_CONTACT'],
      actionCommand: 'CALL_181',
      interpretedIntent: 'Women Safety & Anti-Harassment',
    };
  }

  // 5. CALL 112 / POLICE / PCR / THANA
  const policeKeywords = ['police', 'polce', 'plice', 'cop', 'pcr', 'thana', 'thanedar', 'kotwali', '112', 'call112'];
  if (
    lower.includes('call 112') ||
    lower.includes('call police') ||
    lower.includes('police bulao') ||
    lower.includes('thana') ||
    fuzzyMatches(tokens, policeKeywords)
  ) {
    return {
      reply: `🚨 **CONNECTING TO 112 POLICE & EMERGENCY DISPATCH**\n\n• Connecting your handset to India's National Emergency Response Support System (ERSS 112).\n• State your current location clearly (${coordsStr}).\n• Stay on the line until the operator confirms vehicle dispatch.`,
      isEmergency: true,
      situationCategory: 'emergency_dispatch',
      suggestedActions: ['CALL_112', 'SHARE_LOCATION', 'NEARBY_POLICE', 'TRIGGER_SOS'],
      actionCommand: 'CALL_112',
      interpretedIntent: '112 Police Dispatch',
    };
  }

  // 6. MEDICAL / ACCIDENT / AMBULANCE / 108 / INJURY / BLOOD
  const medicalKeywords = [
    'accident', 'acident', 'axident', 'ambulance', 'amblance', 'ambulens', 'hospital', 'hosptal',
    'doctor', 'doktor', 'blood', 'bleeding', 'khun', 'chot', 'ghayal', 'fracture', 'heart', 'attack',
    'chestpain', 'breath', 'unconscious', 'behosh', '108', 'call108'
  ];
  if (
    lower.includes('medical') ||
    lower.includes('accident') ||
    lower.includes('ambulance') ||
    lower.includes('chot') ||
    lower.includes('blood') ||
    lower.includes('108') ||
    fuzzyMatches(tokens, medicalKeywords)
  ) {
    return {
      reply: `🏥 **CRITICAL MEDICAL EMERGENCY PROTOCOL (108 AMBULANCE)**\n\n1. **Call 108 Immediately**: Dial 108 for rapid trauma ambulance and paramedical crew.\n2. **Control Bleeding**: Apply firm, continuous pressure over wounds with a clean cloth.\n3. **Do Not Move Spinal Trauma**: If head, neck, or spine injury is suspected, keep patient still unless fire is present.\n4. **Share GPS Coordinates**: Send live location so ambulance navigates straight to you.`,
      isEmergency: true,
      situationCategory: 'medical',
      suggestedActions: ['CALL_108', 'FIRST_AID', 'CALL_112', 'SHARE_LOCATION', 'NEARBY_HOSPITALS', 'CALL_CONTACT'],
      actionCommand: 'CALL_108',
      interpretedIntent: 'Emergency Medical & Trauma Ambulance',
    };
  }

  // 7. FIRST AID / CPR / BURNS / CHOKING / SNAKEBITE
  const firstAidKeywords = [
    'firstaid', 'frstaid', 'cpr', 'burn', 'jala', 'jalan', 'snakebite', 'saanp', 'choking', 'ghutan',
    'bandage', 'fainting', 'heatstroke', 'seizure', 'daura'
  ];
  if (
    lower.includes('first aid') ||
    lower.includes('cpr') ||
    lower.includes('burn') ||
    lower.includes('snake') ||
    lower.includes('choking') ||
    fuzzyMatches(tokens, firstAidKeywords)
  ) {
    return {
      reply: `🩹 **RAPID FIRST AID & LIFE SUPPORT GUIDE**\n\n• **CPR (Adult)**: 30 hard, fast chest compressions (100–120 bpm, center of chest) followed by 2 rescue breaths.\n• **Severe Bleeding**: Direct continuous pressure with clean cloth. Do not remove soaked gauze; add more layers.\n• **Burns**: Cool immediately under running cool water for 10–20 mins. Do NOT apply ice or butter.\n• **Choking (Heimlich)**: Stand behind, place fist above navel, give quick upward abdominal thrusts.\n• **Snakebite**: Keep patient calm and still. Immobilize limb below heart level. Never cut or suck venom!`,
      isEmergency: true,
      situationCategory: 'first_aid',
      suggestedActions: ['CALL_108', 'CALL_112', 'SHARE_LOCATION', 'NEARBY_HOSPITALS'],
      actionCommand: null,
      interpretedIntent: 'First Aid & CPR Life-Saving Guidance',
    };
  }

  // 8. FIRE / SMOKE / 101 FIRE BRIGADE / GAS LEAK
  const fireKeywords = ['fire', 'fir', 'aag', 'agg', 'smoke', 'dhua', 'dhuan', 'gasleak', 'cylinder', '101', 'call101'];
  if (
    lower.includes('fire') ||
    lower.includes('aag') ||
    lower.includes('smoke') ||
    lower.includes('gas leak') ||
    lower.includes('101') ||
    fuzzyMatches(tokens, fireKeywords)
  ) {
    return {
      reply: `🚒 **FIRE EMERGENCY EVACUATION (101 FIRE BRIGADE)**\n\n1. **Evacuate Now**: Leave immediately via stairs. Never use elevators during a fire.\n2. **Crawl Under Smoke**: Toxic smoke rises. Stay low where fresh air remains.\n3. **Feel Doors**: If a doorknob is hot, do not open it.\n4. **Dial 101**: Call 101 Fire Services once safely outside the structure.`,
      isEmergency: true,
      situationCategory: 'fire',
      suggestedActions: ['CALL_101', 'CALL_112', 'SHARE_LOCATION', 'TRIGGER_SOS'],
      actionCommand: 'CALL_101',
      interpretedIntent: 'Fire & Gas Leak Emergency',
    };
  }

  // 9. DISASTER / FLOOD / EARTHQUAKE / CYCLONE / NDRF / 1070
  const disasterKeywords = [
    'disaster', 'dsaster', 'flood', 'baadh', 'badh', 'cyclone', 'toofan', 'earthquake', 'bhukamp',
    'tsunami', 'landslide', 'ndrf', '1070', '1076'
  ];
  if (
    lower.includes('flood') ||
    lower.includes('disaster') ||
    lower.includes('cyclone') ||
    lower.includes('earthquake') ||
    lower.includes('baadh') ||
    fuzzyMatches(tokens, disasterKeywords)
  ) {
    return {
      reply: `🌊 **DISASTER & FLOOD RESILIENCE CENTER**\n\n1. **Flood Safety**: Move to higher ground immediately. Never walk or drive through flowing water (just 15cm can knock you down).\n2. **Earthquake (Drop, Cover, Hold)**: Take cover under a sturdy desk or interior wall away from windows.\n3. **NDRF & Relief**: Dial 1070 (State Emergency) or 1076 (NDRF Relief Dispatch).\n4. **Disaster Dashboard**: Opening the real-time Flood & Climate Warning Center.`,
      isEmergency: false,
      situationCategory: 'disaster',
      suggestedActions: ['DISASTER_CENTER', 'CALL_DISASTER', 'SHARE_LOCATION', 'FIND_SAFE_PLACES'],
      actionCommand: 'DISASTER_CENTER',
      interpretedIntent: 'Natural Disaster & Flood Alert',
    };
  }

  // 10. FAKE CALL SIMULATOR (Typos: fak cal, fake cll, fake call)
  const fakeCallKeywords = ['fakecall', 'fakcal', 'fakecll', 'callpapa', 'jhootacall', 'ringphone'];
  if (
    lower.includes('fake call') ||
    lower.includes('fak cal') ||
    lower.includes('fake cll') ||
    lower.includes('jhooti call') ||
    lower.includes('call pretend') ||
    fuzzyMatches(tokens, fakeCallKeywords)
  ) {
    return {
      reply: `📱 **TRIGGERING FAKE INCOMING CALL SIMULATOR**\n\n• Simulating an urgent realistic incoming phone call from "Papa (Home)".\n• Put phone to your ear and pretend to talk: *"Haan Papa, main bus 2 minute mein chowk pahunch rahi hoon, aap wahin khade ho na?"*\n• This discourages stalkers from approaching you.`,
      isEmergency: false,
      situationCategory: 'fake_call',
      suggestedActions: ['FAKE_CALL', 'START_ESCORT', 'SHARE_LOCATION', 'CALL_CONTACT'],
      actionCommand: 'FAKE_CALL',
      interpretedIntent: 'Fake Incoming Call Simulator',
    };
  }

  // 11. WALK WITH ME / VIRTUAL ESCORT
  if (
    lower.includes('walk with me') ||
    lower.includes('escort') ||
    lower.includes('sath chalo') ||
    lower.includes('journey tracker') ||
    lower.includes('escort mode')
  ) {
    return {
      reply: `🚶‍♀️ **VIRTUAL "WALK WITH ME" ESCORT ACTIVATED**\n\n• I will monitor your journey with periodic safety check-in countdown timers.\n• If a check-in is missed, Safe AI automatically sends SOS alerts to your saved emergency contacts.\n• Opening Women Safety Shield Escort portal now.`,
      isEmergency: false,
      situationCategory: 'escort',
      suggestedActions: ['START_ESCORT', 'SHARE_LOCATION', 'FAKE_CALL', 'CALL_CONTACT'],
      actionCommand: 'START_ESCORT',
      interpretedIntent: 'Walk With Me Virtual Journey Escort',
    };
  }

  // 12. EVIDENCE CAMERA (Typos: camra, cmra, photo, foto, vidio)
  const cameraKeywords = ['camera', 'camra', 'cmra', 'kamera', 'photo', 'foto', 'picture', 'video', 'vidio', 'proof', 'saboot'];
  if (
    lower.includes('camera') ||
    lower.includes('photo') ||
    lower.includes('take picture') ||
    lower.includes('evidence') ||
    lower.includes('video') ||
    fuzzyMatches(tokens, cameraKeywords)
  ) {
    return {
      reply: `📷 **EMERGENCY EVIDENCE CAMERA LAUNCHED**\n\n• Captures timestamped photos with live GPS coordinates, altitude, and city watermark embedded directly into the image.\n• Photos are stored locally on your device for legal evidence without server upload.`,
      isEmergency: false,
      situationCategory: 'evidence_camera',
      suggestedActions: ['OPEN_CAMERA', 'RECORD_AUDIO', 'SHARE_LOCATION'],
      actionCommand: 'OPEN_CAMERA',
      interpretedIntent: 'Evidence Camera with GPS Watermarking',
    };
  }

  // 13. RECORD AUDIO / VOICE PROOF (Typos: recrod, audio, awaz)
  const audioKeywords = ['audio', 'recrod', 'recordaudio', 'voicenote', 'awaz', 'mic', 'soundproof'];
  if (
    lower.includes('record audio') ||
    lower.includes('audio memo') ||
    lower.includes('voice note') ||
    lower.includes('awaz record') ||
    fuzzyMatches(tokens, audioKeywords)
  ) {
    return {
      reply: `🎙️ **EMERGENCY AUDIO EVIDENCE RECORDER**\n\n• Recording 30-second discreet ambient audio memo.\n• Preserves verbal threats, vehicle engine sounds, or distress audio securely on your browser for instant playback or download.`,
      isEmergency: false,
      situationCategory: 'audio_record',
      suggestedActions: ['RECORD_AUDIO', 'OPEN_CAMERA', 'SHARE_LOCATION'],
      actionCommand: 'RECORD_AUDIO',
      interpretedIntent: 'Emergency Audio Memo Recorder',
    };
  }

  // 14. STROBE FLASHLIGHT / MORSE SOS (Typos: strob, torc, torch, flaslight)
  const flashKeywords = ['strobe', 'strob', 'torch', 'torc', 'flashlight', 'flaslight', 'morse', 'batti'];
  if (
    lower.includes('strobe') ||
    lower.includes('torch') ||
    lower.includes('flashlight') ||
    lower.includes('morse') ||
    fuzzyMatches(tokens, flashKeywords)
  ) {
    return {
      reply: `🔦 **FLASHLIGHT MORSE SOS STROBE ACTIVATED**\n\n• Flashing international SOS beacon: · · · — — — · · ·\n• High-visibility optical signal visible to rescue helicopters, passing patrols, and neighbors in power outages or dense fog.`,
      isEmergency: false,
      situationCategory: 'flashlight_strobe',
      suggestedActions: ['STROBE_FLASHLIGHT', 'TRIGGER_SOS', 'SHARE_LOCATION'],
      actionCommand: 'STROBE_FLASHLIGHT',
      interpretedIntent: 'Flashlight Morse SOS Optical Beacon',
    };
  }

  // 15. SHARE LOCATION / WHATSAPP SOS (Typos: shre, lcshn, locashun)
  const locationKeywords = ['sharelocation', 'sendlocation', 'shrelocation', 'locashun', 'whatsapp', 'gps', 'coordinates'];
  if (
    lower.includes('share location') ||
    lower.includes('send location') ||
    lower.includes('send my location') ||
    lower.includes('location bhej') ||
    lower.includes('whatsapp') ||
    lower.includes('coordinates') ||
    fuzzyMatches(tokens, locationKeywords)
  ) {
    return {
      reply: `📍 **LIVE GPS DISPATCH READY**\n\n• Current Coordinates: ${coordsStr}\n• Live Google Maps Link: https://maps.google.com/?q=${location?.lat || 28.6139},${location?.lng || 77.2090}\n• Tap 'Share Live Location' for instant SMS or 'WhatsApp SOS' to send directly to emergency chats.`,
      isEmergency: false,
      situationCategory: 'share_location',
      suggestedActions: ['SHARE_LOCATION', 'WHATSAPP_SOS', 'COPY_COORDINATES', 'CALL_CONTACT'],
      actionCommand: 'SHARE_LOCATION',
      interpretedIntent: 'GPS Location Sharing & WhatsApp SOS',
    };
  }

  // 16. CALL CONTACT / MOM / DAD / FAMILY
  const contactKeywords = ['mom', 'mother', 'dad', 'father', 'papa', 'mummy', 'maa', 'bhai', 'behen', 'sister', 'brother', 'contact'];
  if (
    lower.includes('call mother') ||
    lower.includes('call mom') ||
    lower.includes('call dad') ||
    lower.includes('call papa') ||
    lower.includes('call my contact') ||
    lower.includes('call family') ||
    fuzzyMatches(tokens, contactKeywords)
  ) {
    return {
      reply: `📞 **DIALING TRUSTED CONTACT: ${contactName.toUpperCase()}**\n\n• Dialing your pre-saved emergency contact.\n• Inform them of your location (${coordsStr}) and what is happening.\n• Stay on the line in a safe area.`,
      isEmergency: true,
      situationCategory: 'call_contact',
      suggestedActions: ['CALL_CONTACT', 'SHARE_LOCATION', 'WHATSAPP_SOS', 'CALL_112'],
      actionCommand: 'CALL_CONTACT',
      interpretedIntent: 'Emergency Family Contact Call',
    };
  }

  // 17. FIND SAFE PLACES / SHELTER / HAVENS / RADAR
  const safePlacesKeywords = ['safeplace', 'shelter', 'safehaven', 'radar', 'havens', 'refuge', 'sharan'];
  if (
    lower.includes('safe place') ||
    lower.includes('safe places') ||
    lower.includes('shelter') ||
    lower.includes('safe haven') ||
    lower.includes('where to go') ||
    lower.includes('kahan jau') ||
    fuzzyMatches(tokens, safePlacesKeywords)
  ) {
    return {
      reply: `🗺️ **OPENING GEO-RADAR MAP & SAFE HAVENS**\n\n• Navigating to Safe Bharat Geo-Radar with verified 24x7 Transit Shelters, Police Stations, Trauma Centers, and Sakhi Centers plotted near your coordinates.`,
      isEmergency: false,
      situationCategory: 'safe_places',
      suggestedActions: ['FIND_SAFE_PLACES', 'NEARBY_POLICE', 'NEARBY_HOSPITALS', 'SHARE_LOCATION'],
      actionCommand: 'FIND_SAFE_PLACES',
      interpretedIntent: 'Geo-Radar Safe Havens & Shelters',
    };
  }

  // 18. NEARBY POLICE STATIONS
  if (lower.includes('nearby police') || lower.includes('pass me thana') || lower.includes('closest police')) {
    return {
      reply: `👮 **LOCATING NEAREST POLICE STATIONS ON RADAR**\n\n• Displaying all certified police stations, PCR van nodes, and women help desks within 5km radius.`,
      isEmergency: false,
      situationCategory: 'nearby_police',
      suggestedActions: ['NEARBY_POLICE', 'CALL_112', 'FIND_SAFE_PLACES', 'SHARE_LOCATION'],
      actionCommand: 'NEARBY_POLICE',
      interpretedIntent: 'Police Station Radar Locator',
    };
  }

  // 19. NEARBY HOSPITALS
  if (lower.includes('nearby hospital') || lower.includes('pass me hospital') || lower.includes('closest hospital')) {
    return {
      reply: `🏥 **LOCATING NEAREST EMERGENCY TRAUMA HOSPITALS**\n\n• Showing 24x7 trauma centers, government civil hospitals, and ICU facilities with verified emergency contact numbers.`,
      isEmergency: false,
      situationCategory: 'nearby_hospitals',
      suggestedActions: ['NEARBY_HOSPITALS', 'CALL_108', 'CALL_112', 'FIND_SAFE_PLACES'],
      actionCommand: 'NEARBY_HOSPITALS',
      interpretedIntent: 'Hospital & Trauma Center Radar',
    };
  }

  // 20. REPORT INCIDENT / HAZARD / CIVIC ISSUE
  const reportKeywords = ['report', 'incident', 'hazard', 'shikayat', 'complain', 'garbage', 'kachra', 'pothole', 'gaddha'];
  if (
    lower.includes('report') ||
    lower.includes('incident') ||
    lower.includes('hazard') ||
    lower.includes('shikayat') ||
    lower.includes('kachra') ||
    lower.includes('pothole') ||
    fuzzyMatches(tokens, reportKeywords)
  ) {
    return {
      reply: `📝 **INCIDENT REPORTING STUDIO**\n\n• Log civic hazards, flooding spots, road dangers, or crimes directly onto the SAFE BHARAT verified civic radar.\n• Community upvotes prioritize reports for municipal and disaster authority dispatch.`,
      isEmergency: false,
      situationCategory: 'report_incident',
      suggestedActions: ['REPORT_INCIDENT', 'OPEN_CAMERA', 'FIND_SAFE_PLACES'],
      actionCommand: 'REPORT_INCIDENT',
      interpretedIntent: 'Civic Incident Reporting Studio',
    };
  }

  // 21. GREEN BHARAT / SUSTAINABILITY / CARBON KARMA
  const greenKeywords = ['green', 'carbon', 'eco', 'ped', 'tree', 'karma', 'points', 'sustainability', 'pradushan'];
  if (
    lower.includes('green') ||
    lower.includes('carbon') ||
    lower.includes('karma') ||
    lower.includes('tree') ||
    lower.includes('eco') ||
    fuzzyMatches(tokens, greenKeywords)
  ) {
    return {
      reply: `🌿 **GREEN BHARAT SUSTAINABILITY HUB**\n\n• Current Karma Points: ${user?.points || 0} pts (Active Streak: ${user?.streak || 1} days).\n• Track CO2 reductions, water savings, tree plantation missions, and climate resilience practices across India.`,
      isEmergency: false,
      situationCategory: 'green_bharat',
      suggestedActions: ['GREEN_BHARAT', 'DAILY_MISSIONS', 'IKS_ARCHIVE'],
      actionCommand: 'GREEN_BHARAT',
      interpretedIntent: 'Green Bharat Sustainability Hub',
    };
  }

  // 22. INDIAN KNOWLEDGE SYSTEMS (IKS ARCHIVE)
  const iksKeywords = ['iks', 'ancient', 'ayurveda', 'heritage', 'traditional', 'purana', 'vedic', 'gyan'];
  if (
    lower.includes('iks') ||
    lower.includes('ancient') ||
    lower.includes('traditional knowledge') ||
    lower.includes('heritage') ||
    fuzzyMatches(tokens, iksKeywords)
  ) {
    return {
      reply: `📜 **INDIAN KNOWLEDGE SYSTEMS (IKS ARCHIVE)**\n\n• Explore centuries of indigenous Indian disaster resilience, traditional water harvesting (Stepwells/Ahar-Pyne), earthquake-resistant Dhajji-Dewari architecture, and natural medicine.`,
      isEmergency: false,
      situationCategory: 'iks_archive',
      suggestedActions: ['IKS_ARCHIVE', 'GREEN_BHARAT'],
      actionCommand: 'IKS_ARCHIVE',
      interpretedIntent: 'IKS Indigenous Knowledge Archive',
    };
  }

  // 23. DAILY MISSIONS
  if (lower.includes('mission') || lower.includes('daily task') || lower.includes('today mission')) {
    return {
      reply: `📋 **DAILY CIVIC & SAFETY MISSIONS**\n\n• Complete today's safety checks, energy conservation habits, and civic audits to earn Karma points and level up your resilience rank.`,
      isEmergency: false,
      situationCategory: 'daily_missions',
      suggestedActions: ['DAILY_MISSIONS', 'GREEN_BHARAT'],
      actionCommand: 'DAILY_MISSIONS',
      interpretedIntent: 'Daily Safety & Civic Missions',
    };
  }

  // 24. PROFILE / EMERGENCY CONTACTS CONFIG
  if (lower.includes('profile') || lower.includes('contact edit') || lower.includes('change phone') || lower.includes('add contact')) {
    return {
      reply: `👤 **MANAGE PROFILE & EMERGENCY CONTACTS**\n\n• Open your profile settings to add/update your trusted family phone numbers, medical blood group, and emergency instructions.`,
      isEmergency: false,
      situationCategory: 'edit_profile',
      suggestedActions: ['EDIT_PROFILE', 'CALL_CONTACT'],
      actionCommand: 'EDIT_PROFILE',
      interpretedIntent: 'User Profile & Contacts Configuration',
    };
  }

  // 25. SPEAK / READ ALOUD
  if (lower.includes('speak') || lower.includes('read aloud') || lower.includes('bol kar sunao') || lower.includes('bol ke')) {
    return {
      reply: `🔊 **TEXT-TO-SPEECH READOUT**\n\n• Speaking emergency guidance aloud through your phone speaker or earphones so you can listen hands-free.`,
      isEmergency: false,
      situationCategory: 'speech',
      suggestedActions: ['SPEAK_ADVICE', 'TRIGGER_SOS', 'CALL_112'],
      actionCommand: 'SPEAK_ADVICE',
      interpretedIntent: 'Voice Read Aloud Audio Assist',
    };
  }

  // 26. UNSAFE CAB / TAXI / AUTO (Typos: auto, uber, ola)
  if (lower.includes('cab') || lower.includes('taxi') || lower.includes('uber') || lower.includes('ola') || lower.includes('auto') || lower.includes('driver')) {
    return {
      reply: `🚖 **UNSAFE CAB / AUTO PROTOCOL**\n\n1. **Check Route**: Has the driver diverted from the navigation map?\n2. **Make a Call Out Loud**: Phone your family or tap 'Trigger Fake Call' and say clearly: *"Bhaiya, main cab number UP16... mein hoon, 10 min mein main road par milte hain."*\n3. **Share Live Location**: Dispatch your live GPS link immediately.\n4. **If Threatened**: Demand to stop at the next traffic light or petrol station and dial 112.`,
      isEmergency: true,
      situationCategory: 'unsafe_transport',
      suggestedActions: ['FAKE_CALL', 'SHARE_LOCATION', 'WHATSAPP_SOS', 'CALL_CONTACT', 'CALL_112'],
      actionCommand: 'FAKE_CALL',
      interpretedIntent: 'Unsafe Cab / Vehicle Travel',
    };
  }

  // 27. LOST / UNFAMILIAR ROAD / NIGHT (Typos: lost, lst, rasta, bhatak)
  const lostKeywords = ['lost', 'lst', 'rasta', 'bhatak', 'kidhar', 'kahan', 'unfamiliar', 'sunsaan', 'dark'];
  if (
    lower.includes('lost') ||
    lower.includes('rasta') ||
    lower.includes('where am i') ||
    lower.includes('kho gaya') ||
    fuzzyMatches(tokens, lostKeywords)
  ) {
    return {
      reply: `📍 **NAVIGATION & ORIENTATION ASSIST**\n\n1. **Stop & Orient**: Stand under a bright streetlamp or in front of an open establishment.\n2. **Share Location**: Tap 'Share Live Location' to dispatch your exact coordinate link to family.\n3. **Find Safe Havens**: Tap 'Find Safe Places' to view the nearest 24x7 transit hubs and police outposts on Geo-Radar.`,
      isEmergency: false,
      situationCategory: 'lost',
      suggestedActions: ['SHARE_LOCATION', 'FIND_SAFE_PLACES', 'WHATSAPP_SOS', 'CALL_CONTACT'],
      actionCommand: 'FIND_SAFE_PLACES',
      interpretedIntent: 'Lost in Unfamiliar Territory',
    };
  }

  // 28. SILENT DISTRESS / CANNOT TALK / HIDING
  if (
    lower.includes("can't talk") ||
    lower.includes('cant talk') ||
    lower.includes('silent') ||
    lower.includes('quiet') ||
    lower.includes('bol nahi sakta') ||
    lower.includes('chup')
  ) {
    return {
      reply: `🤫 **SILENT DISTRESS MODE**\n\n• Keep your device completely muted.\n• Hide in a secure, lockable room away from windows and doors.\n• Silent emergency SMS and WhatsApp coordinates have been readied for dispatch.\n• Do NOT make noise. Tap 'Share Live Location' quietly.`,
      isEmergency: true,
      situationCategory: 'silent_distress',
      suggestedActions: ['SHARE_LOCATION', 'WHATSAPP_SOS', 'OPEN_CAMERA', 'TRIGGER_SOS'],
      actionCommand: 'SHARE_LOCATION',
      interpretedIntent: 'Silent Covert Distress',
    };
  }

  // 29. FEELING SCARED / UNSAFE (Typos: scared, darr, dar, darr lag raha)
  const scaredKeywords = ['scared', 'scard', 'dar', 'darr', 'unsafe', 'nervous', 'afraid', 'khauf'];
  if (
    lower.includes('feel unsafe') ||
    lower.includes('dar lag raha') ||
    lower.includes('scared') ||
    lower.includes('unsafe') ||
    fuzzyMatches(tokens, scaredKeywords)
  ) {
    return {
      reply: `🛡️ **I AM HERE WITH YOU — YOU ARE NOT ALONE**\n\n1. **Stay Grounded**: Take slow, deep breaths. Walk purposefully toward well-lit, populated areas.\n2. **Fake Call**: Tap 'Trigger Fake Call' to make it look like someone is actively waiting for you.\n3. **Share GPS**: Send your live coordinates to family now so they can monitor you.\n4. **Emergency Ready**: If anyone approaches aggressively, tap 'Start SOS' or 'Call 112' without hesitation.`,
      isEmergency: true,
      situationCategory: 'unsafe_situation',
      suggestedActions: ['FAKE_CALL', 'SHARE_LOCATION', 'CALL_CONTACT', 'FIND_SAFE_PLACES', 'CALL_112'],
      actionCommand: 'FAKE_CALL',
      interpretedIntent: 'Feeling Unsafe / Scared Support',
    };
  }

  // 30. NO SIGNAL / OFFLINE CONNECTIVITY / DEAD ZONE
  const offlineKeywords = ['offline', 'nosignal', 'deadzone', 'nonetwork', 'tower', 'signal'];
  if (
    lower.includes('no signal') ||
    lower.includes('offline') ||
    lower.includes('no network') ||
    lower.includes('dead zone') ||
    lower.includes('network nahi') ||
    lower.includes('signal nahi') ||
    lower.includes('tower nahi') ||
    fuzzyMatches(tokens, offlineKeywords)
  ) {
    return {
      reply: `📶 **NO-SIGNAL OFFLINE SURVIVAL PROTOCOL**\n\n1. **Cached Location Active**: Coordinates cached at ${coordsStr}. Your last known location and nearest shelters are preserved offline.\n2. **Acoustic Signaling**: Sound the International 3-Blast Distress signal or continuous siren to alert search teams.\n3. **Optical SOS Strobe**: Trigger camera LED or screen flashes (· · · — — — · · ·) visible across kilometers.\n4. **Emergency 112 Call**: You can dial 112 even with 0 bars or NO SIM card under Universal Emergency Roaming.`,
      isEmergency: false,
      situationCategory: 'offline_survival',
      suggestedActions: ['FIND_SAFE_PLACES', 'TRIGGER_SOS', 'STROBE_FLASHLIGHT', 'COPY_COORDINATES', 'CALL_112'],
      actionCommand: null,
      interpretedIntent: 'Offline Connectivity & Zero-Signal Survival',
    };
  }

  // DEFAULT COMPREHENSIVE SAFETY ASSISTANT
  return {
    reply: `Namaste! I am Safe AI, your 24x7 intelligent safety assistant for SAFE BHARAT.\n\nI can execute **every feature** of this app for you:\n• 🚨 **Start SOS Alarm** / 🔇 **Stop Siren**\n• 📍 **Share Live GPS Location** & **WhatsApp SOS**\n• 📞 **Call 112 (Police), 181 (Women), 108 (Ambulance), 101 (Fire)**\n• 📱 **Trigger Fake Incoming Call**\n• 🚶‍♀️ **Walk With Me Safety Escort**\n• 📷 **Evidence Camera** & 🎙️ **Audio Memo**\n• 🗺️ **Geo-Radar Safe Havens & Shelters**\n• 🩹 **First Aid & CPR Guides**\n• 🌊 **Flood & Disaster Center**\n• 📝 **Report Civic Incidents** & 🌿 **Green Bharat**\n\nTell me what you need—even with typos or in Hindi/Hinglish!`,
    isEmergency: false,
    situationCategory: 'general_safety',
    suggestedActions: ['SHARE_LOCATION', 'CALL_CONTACT', 'CALL_112', 'FIND_SAFE_PLACES', 'TRIGGER_SOS'],
    actionCommand: null,
    interpretedIntent: 'General Safety Assistant & App Navigator',
  };
}
