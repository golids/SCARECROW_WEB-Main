
import type { Language } from '../types'

export const translations: Record<Language, Record<string, string>> = {
  en: {
    workspace: 'WORKSPACE',
    overview: 'Overview',
    devices: 'Devices',
    detections: 'Detection Logs',
    alerts: 'Alerts & Activities',
    settings: 'Settings',

    secure: 'Secure admin access',
    admin: 'Administrator',
    live: 'Live database',
    refresh: 'Refresh',
    fieldOps: 'FIELD OPERATIONS',
    goodDay: 'Good day, Administrator',
    clients: 'Clients',
    clientStats: 'Client Statistics',

    overviewDesc: "Here’s what’s happening across your ScareCROW field devices.",

    registered: 'Registered devices',
    registeredNote: 'All registered field units',
    online: 'Online devices',
    heartbeat: 'Heartbeat within 30 seconds',
    birdsToday: 'Bird detections today',
    todayRecords: "Based on today's records",
    otherEvents: 'Other events',
    deviceActivity: 'Device and system activity',

    deviceStatus: 'Device status',
    liveHeartbeat: 'Live heartbeat monitoring',
    viewAll: 'View all',
    recent: 'Recent activity',
    latestEvents: 'Latest database events',
    viewLogs: 'View logs',

    noDevices: 'No devices found in the database.',
    noActivity: 'No activity records yet.',

    statusNote: 'Device status is calculated from the latest heartbeat.',
    statusNoteEnd: 'A device is online only when its latest heartbeat is within 30 seconds.',

    registeredTitle: 'Registered devices',
    monitorDesc: 'Monitor each field unit and its most recent heartbeat.',
    deviceInfo: 'Device information is read from your Supabase database',

    device: 'DEVICE',
    location: 'LOCATION',
    status: 'STATUS',
    lastSeen: 'LAST SEEN',
    ipAddress: 'IP ADDRESS',

    notSet: 'Not set',
    never: 'Never connected',
    justNow: 'Just now',
    minAgo: 'min ago',
    hrAgo: 'hr ago',
    daysAgo: 'days ago',

    protection: 'Device creation, archiving, and deletion are intentionally not enabled in this first web build to protect registered field records.',

    history: 'Detection & event history',
    alertsTitle: 'Alerts & activities',
    recordsDesc: 'Records are loaded directly from database and update when new events arrive.',

    search: 'Search species, event, or device…',
    records: 'records',
    noMatches: 'No matching records found.',

    systemSettings: 'System settings',
    settingsDesc: 'Manage your administrator session and notification preferences.',

    account: 'Administrator account',
    signedIn: 'Currently signed-in account',
    authenticated: 'Authenticated administrator',
    signOut: 'Sign out',

    notifications: 'Notification preferences',
    savedPerAccount: 'Saved per administrator account',
    disconnection: 'Device disconnection',
    errors: 'Device errors',
    lowBattery: 'Low battery',
    reconnection: 'Device reconnection',
    birdDetection: 'Bird detection',

    language: 'Language',
    languageDesc: 'Choose the language used throughout the dashboard.',
    english: 'English',
    cebuano: 'Cebuano (Bisaya)',

    footer: 'SCARECROW • Smart field monitoring',
    connected: 'Connected to Supabase',
    syncing: 'Syncing with Supabase…',

    welcome: 'Welcome back',
    loginDesc: 'Sign in to manage your ScareCROW devices.',
    email: 'Email address',
    password: 'Password',
    signingIn: 'Signing in…',
    signIn: 'Sign in',
    existingAccount: 'Use an existing ScareCROW administrator account.',

    connect: 'Connect your Supabase project',
    connectDesc: 'Create a .env file in the web project using .env.example, then add your Supabase project URL and publishable/anon key.',
    neverKey: 'Never use your Supabase service-role key in a browser application.',

    loading: 'Loading SCARECROW…',
    unknown: 'Unknown device',
    locationMissing: 'Location not specified',
    birdDetected: 'Bird detected',
    event: 'Event',
    offline: 'Offline',
    offlineDevices: 'Offline devices',
    Online: 'Online',
    onlineDevices: 'Online devices',

    birdDetectionLogs: 'Bird Detection Logs',
    chestnutMunia: 'Chestnut Munia',

    // OVERVIEW TRANSLATIONS

    selected: 'Selected',
    viewStatistics: 'View statistics',
    deviceStatistics: 'Device Statistics',
    statisticsFor: 'Statistics for',

    last7Days: 'Last 7 Days',
    last30Days: 'Last 30 Days',
    allTime: 'All Time',

    totalEvents: 'Total Events',
    eventsRecorded: 'Events recorded',

    birdAlerts: 'Bird Alerts',
    birdDetections: 'Bird detections',

    offlineEvents: 'Offline Events',
    connectionEvents: 'Connection events',

    detectedToday: 'Detected Today',
    birdDetectionsToday: 'Bird detections today',

    averagePerDay: 'Avg. per Day',
    detectionsPerDay: 'Bird detections per day',

    peakTime: 'Peak Time',
    mostDetections: 'Most detections',

    noStatistics: 'No statistics available for this device and date range.',
    thisWeek: 'This Week',

    customRange: 'Custom Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    selectValidDateRange: 'Please select a valid date range.',
  },

  ceb: {
    workspace: 'LUGAR SA TRABAHO',
    overview: 'Kinatibuk-ang Tan-aw',
    devices: 'Mga Device',
    detections: 'Mga Rekord sa Detection',
    alerts: 'Mga Alerto ug Kalihokan',
    settings: 'Mga Setting',

    secure: 'Luwas nga pag-access sa admin',
    admin: 'Administrator',
    live: 'Live nga database',
    refresh: 'I-refresh',
    fieldOps: 'OPERASYON SA UMAHAN',
    goodDay: 'Maayong adlaw, Administrator',
    clients: 'Mga Kliyente',
    clientStats: 'Estadistika sa Kliyente',

    overviewDesc: 'Mao kini ang kahimtang sa imong mga ScareCROW device sa umahan.',

    registered: 'Mga rehistradong device',
    registeredNote: 'Tanang rehistradong device sa umahan',
    online: 'Mga online nga device',
    heartbeat: 'Heartbeat sulod sa 30 segundos',
    birdsToday: 'Mga langgam nga nakita karong adlawa',
    todayRecords: 'Base sa mga rekord karong adlawa',
    otherEvents: 'Uban pang panghitabo',
    deviceActivity: 'Kalihokan sa device ug sistema',

    deviceStatus: 'Kahimtang sa device',
    liveHeartbeat: 'Live nga pagsubay sa heartbeat',
    viewAll: 'Tan-awa tanan',
    recent: 'Bag-ong kalihokan',
    latestEvents: 'Pinakabag-ong mga panghitabo sa database',
    viewLogs: 'Tan-awa ang mga rekord',

    noDevices: 'Walay nakitang device sa database.',
    noActivity: 'Wala pay mga rekord sa kalihokan.',

    statusNote: 'Ang kahimtang sa device gibase sa pinakabag-ong heartbeat.',
    statusNoteEnd: 'Online lang ang device kung ang pinakabag-ong heartbeat niini naa sulod sa 30 segundos.',

    registeredTitle: 'Mga rehistradong device',
    monitorDesc: 'Bantayi ang matag device sa umahan ug ang pinakabag-ong heartbeat.',
    deviceInfo: 'Ang impormasyon sa device gikan sa imong Supabase database',

    device: 'DEVICE',
    location: 'LOKASYON',
    status: 'KAHIMTANG',
    lastSeen: 'KATAPUSANG NAKITA',
    ipAddress: 'IP ADDRESS',

    notSet: 'Wala gibutang',
    never: 'Wala pa nakakonekta',
    justNow: 'Bag-o lang',
    minAgo: 'min ang milabay',
    hrAgo: 'oras ang milabay',
    daysAgo: 'adlaw ang milabay',

    protection: 'Wala pa gi-enable ang paghimo, pag-archive, ug pagtangtang sa device niining unang web version aron mapanalipdan ang mga rekord.',

    history: 'Kasaysayan sa detection ug panghitabo',
    alertsTitle: 'Mga alerto ug kalihokan',
    recordsDesc: 'Direktang gikuha ang mga rekord gikan sa database ug awtomatikong ma-update kung naay bag-ong panghitabo.',

    search: 'Pangitaa ang klase sa langgam, panghitabo, o device…',
    records: 'ka rekord',
    noMatches: 'Walay nakitang katugbang nga rekord.',

    systemSettings: 'Mga setting sa sistema',
    settingsDesc: 'Pagdumala sa imong admin account ug mga pahibalo.',

    account: 'Admin account',
    signedIn: 'Karon naka-sign in nga account',
    authenticated: 'Authenticated nga administrator',
    signOut: 'Gawas sa account',

    notifications: 'Mga pahibalo',
    savedPerAccount: 'Gitipigan para sa matag admin account',
    disconnection: 'Naputol ang koneksyon sa device',
    errors: 'Mga sayop sa device',
    lowBattery: 'Hina ang baterya',
    reconnection: 'Nabalik ang koneksyon sa device',
    birdDetection: 'Nakit-an nga langgam',

    language: 'Pinulongan',
    languageDesc: 'Pilia ang pinulongan nga gamiton sa dashboard.',
    english: 'English',
    cebuano: 'Cebuano (Bisaya)',

    footer: 'SCARECROW • Smart nga pagsubay sa umahan',
    connected: 'Nakakonekta sa Supabase',
    syncing: 'Nag-sync sa Supabase…',

    welcome: 'Maayong pagbalik',
    loginDesc: 'Pag-sign in aron madumala ang imong mga ScareCROW device.',
    email: 'Email address',
    password: 'Password',
    signingIn: 'Nag-sign in…',
    signIn: 'Sign in',
    existingAccount: 'Gamita ang kasamtangang ScareCROW administrator account.',

    connect: 'Ikonekta ang imong Supabase project',
    connectDesc: 'Paghimo og .env file sa web project gamit ang .env.example, dayon ibutang ang Supabase project URL ug publishable/anon key.',
    neverKey: 'Ayaw gamita ang Supabase service-role key sa browser application.',

    loading: 'Nag-load ang SCARECROW…',
    unknown: 'Wala mailhing device',
    locationMissing: 'Walay gibutang nga lokasyon',
    birdDetected: 'Nakit-an nga langgam',
    event: 'Panghitabo',
    offline: 'Offline',
    offlineDevices: 'Mga offline nga device',
    onlineDevices: 'Mga online nga device',

    birdDetectionLogs: 'Mga Rekord sa Pag-detect og Langgam',
    chestnutMunia: 'Mayang Pula',

    // OVERVIEW TRANSLATIONS

    selected: 'Napili',
    viewStatistics: 'Tan-awa ang estadistika',
    deviceStatistics: 'Estadistika sa Device',
    statisticsFor: 'Estadistika para sa',

    last7Days: 'Miaging 7 ka Adlaw',
    last30Days: 'Miaging 30 ka Adlaw',
    allTime: 'Tanan nga Panahon',

    totalEvents: 'Kinatibuk-ang Panghitabo',
    eventsRecorded: 'Mga natala nga panghitabo',

    birdAlerts: 'Mga Alerto sa Langgam',
    birdDetections: 'Mga nadetect nga langgam',

    offlineEvents: 'Mga Offline nga Panghitabo',
    connectionEvents: 'Mga panghitabo sa koneksyon',

    detectedToday: 'Nadetect Karong Adlawa',
    birdDetectionsToday: 'Mga langgam nga nadetect karong adlawa',

    averagePerDay: 'Kasagaran Kada Adlaw',
    detectionsPerDay: 'Mga nadetect nga langgam kada adlaw',

    peakTime: 'Oras nga Pinakadaghan',
    mostDetections: 'Pinakadaghan nga detection',

    noStatistics: 'Walay estadistika alang niini nga device ug panahon.',
    thisWeek: 'Karong Semanaha',

    customRange: 'Pasadya nga Petsa',
    startDate: 'Petsa sa Pagsugod',
    endDate: 'Petsa sa Pagtapos',
    selectValidDateRange: 'Palihog pagpili og husto nga sakop sa petsa.',
  },
}