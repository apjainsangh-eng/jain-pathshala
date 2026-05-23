const T = {
  en: {
    // Login
    username_label: 'Username',
    password_label: 'Password',
    username_placeholder: 'Enter your name',
    password_placeholder: 'Enter your password',
    login_btn: 'Login',
    logging_in: 'Logging in...',
    err_empty: 'Please enter both username and password',
    err_invalid: 'Invalid username or password',
    err_network: 'Network error. Please try again.',
    lang_toggle: 'ગુ',

    // Navigation
    nav_home: 'Home',
    nav_stats: 'Stats',
    nav_history: 'History',
    nav_pending: 'Pending',
    logout: 'Logout',

    // Greetings
    good_morning: 'Good Morning',
    good_afternoon: 'Good Afternoon',
    good_evening: 'Good Evening',
    good_night: 'Good Night',

    // Motivational
    mot_streak_fire: "You're on fire! Keep the streak going! 🔥",
    mot_high_att: "Amazing dedication! You're a star! ⭐",
    mot_high_gatha: "Great gatha progress! Keep learning! 📚",
    mot_streak_ok: "Nice streak! Don't break the chain! 💪",
    mot_att_ok: "You're doing great! Stay consistent! 🎯",
    mot_start: "Every journey begins with a single step! 🚀",

    // Today's actions
    today_goals: "Today's Goals",
    mark_present: 'Mark Present',
    add_gatha: 'Add Gatha',
    record_learning: 'Record learning',
    present_check: 'Present ✓',
    xp_earned: 'XP earned!',
    pending_dots: 'Pending...',
    waiting_approval: 'Waiting for approval',
    today_gathas: "Today's Gathas",

    // View switching
    view_all: 'View All',
    back_to_me: 'Back to Me',
    viewing: 'Viewing',
    actions_for_user: 'Actions will be performed for this user',

    // Streak
    streak_current: 'Current Streak',
    streak_best: 'Best',
    day: 'day',
    days: 'days',
    streak_legendary: 'Legendary!',
    streak_amazing: 'Amazing!',
    streak_great: 'Great!',
    streak_good: 'Good!',
    streak_started: 'Started!',
    streak_start_today: 'Start today!',

    // Attendance tracker
    att_tracker: 'Attendance Tracker',
    att_days_absent: 'days absent',
    att_present: 'present',
    att_working_days: 'working days',
    att_sundays_note: '* Sundays excluded from count',

    // Absence messages
    abs_perfect: 'Perfect attendance this month! 🌟',
    abs_great: 'Great job! Just a few days missed. Keep it up! 💪',
    abs_warn: "You missed {n} days. Let's get back on track! 🎯",
    abs_urgent: "{n} days absent! Your classmates are ahead. Come back! 🚀",
    abs_critical: "{n} days missed! Don't fall behind — every day matters! 🙏",

    // Month strip
    month_glance: 'This Month at a Glance',
    present: 'Present',
    absent: 'Absent',
    sunday: 'Sunday',

    // Activity card
    your_activity: 'Your Activity',
    last_visited: 'Last visited',
    today_mark: 'Today! ✓',
    days_ago: '{n} {day} ago',
    next_badge: 'Next badge',
    days_to_unlock: 'Just {n} more {day} to unlock!',

    // Quick stats
    days_present: 'Days Present',
    new_gathas: 'New Gathas',
    this_month: 'This Month',

    // Badges
    your_badges: 'Your Badges',
    no_badges_yet: 'No badges yet this month',
    keep_learning: 'Keep learning to unlock!',
    almost_there: 'Almost There! Keep Going!',

    // Tips
    quick_tips: 'Quick Tips',
    tip1: 'Tap the blue button to mark your attendance daily',
    tip2: 'Record your gatha learning with the purple button',
    tip3: 'Check Stats to see your achievements and progress',
    tip4: 'Pending tab shows items waiting for teacher approval',

    // Level modal
    tap_level: 'Tap to see level details & XP breakdown',
    level_progress: 'Level Progress',
    xp_journey: 'Your XP Journey',
    current_level: 'Current Level',
    total_xp: 'Total XP',
    how_earned_xp: 'How You Earned XP This Month',
    all_levels: 'All Levels',
    xp_needed: 'XP needed',
    starting_level: 'Starting level',
    got_it: 'Got it! 💪',

    // Gatha modal
    edit_entry: 'Edit Entry',
    add_gatha_title: 'Add Gatha',
    record_progress: 'Record your learning progress',
    for_user: 'For',
    new_learning: 'New Learning',
    revision: 'Revision',
    sutra_name: '📖 Sutra Name',
    sutra_placeholder: 'Enter sutra name or select above',
    sutra_help: 'Enter the name of the sutra you learned or revised',
    which_gatha: '📝 Which Gatha',
    which_gatha_placeholder: 'e.g., Gatha 1-5 or 3,4,5',
    gatha_help: 'Enter the gatha numbers you completed (e.g., 1-5 or 3,4,5)',
    total_count: '#️⃣ Total Count',
    total_placeholder: 'Or enter custom count',
    total_help: 'How many gathas did you complete in total?',
    cancel: 'Cancel',
    save: 'Save',
    submit: 'Submit',

    // Months
    month_jan: 'January', month_feb: 'February', month_mar: 'March', month_apr: 'April',
    month_may: 'May', month_jun: 'June', month_jul: 'July', month_aug: 'August',
    month_sep: 'September', month_oct: 'October', month_nov: 'November', month_dec: 'December',

    // History
    my_history: 'My Personal History',
    viewing_history: "Viewing {name}'s History",
    history_hint: 'Green = Present • Red tint = Sunday (Holiday) • Tap green days for details',
    loading_history: 'Loading history...',
    new_gathas_hist: 'New Gathas',
    revisions: 'Revisions',
    no_new_gathas: 'No new gathas recorded',
    no_revisions: 'No revisions recorded',
    sutra_label: 'Sutra',
    gatha_label: 'Gatha',
    count_label: 'Count',
    present_badge: 'Present ✓',
    close: 'Close',
    try_again: 'Try Again',

    // Pending
    pending_info_title: 'What is Pending?',
    pending_info_desc: 'After you mark attendance or add gathas, your teacher needs to approve them.',
    pending_approvals: 'Pending Approvals',
    all_caught_up_big: 'All Caught Up! 🎉',
    no_pending_approvals: 'No pending approvals',
    items_waiting: 'items awaiting approval',
    awaiting_approval: 'Awaiting Approval',
    rejected_section: 'Rejected',
    pending_badge: 'Pending',
    approved_badge: 'Approved',
    rejected_badge: 'Rejected',
    reason_label: 'Reason',
    gatha_type_new: 'Gatha - New',
    gatha_type_revision: 'Gatha - Revision',
    attendance_label: 'Attendance',

    // User switcher
    switch_account: 'Switch Account',
    members_tap: 'members in group • Tap to switch',
    you_suffix: '(You)',
    member_tip: 'You can add gathas and mark attendance for any member',

    // Leaderboard
    loading_leaderboard: 'Loading leaderboard...',
    leaderboard_error: 'Unable to load leaderboard',
    leaderboard_tip: 'Leaderboard updates when you change month/year 🌟',
    days_present_sub: 'days present',
    new_gathas_sub: 'new gathas',

    // Confirmation
    cannot_undo: 'This action cannot be undone',
    delete_btn: 'Delete',

    // System
    loading_dashboard: 'Loading your dashboard...',
    offline_msg: '📵 You are offline. Some features may not work.',
    offline_short: '📵 You are offline.',
    proverb_suffix: 'Proverb',
  },

  gu: {
    // Login
    username_label: 'Username',
    password_label: 'Password',
    username_placeholder: 'તમારું નામ લખો',
    password_placeholder: 'Password લખો',
    login_btn: 'Login',
    logging_in: 'Login થઈ રહ્યું છે...',
    err_empty: 'Username અને password બંને લખો',
    err_invalid: 'ખોટું username અથવા password',
    err_network: 'Internet ભૂળ. ફરી try કરો.',
    lang_toggle: 'EN',

    // Navigation
    nav_home: 'ઘર',
    nav_stats: 'Stats',
    nav_history: 'ઇતિહાસ',
    nav_pending: 'બાકી',
    logout: 'Exit',

    // Greetings
    good_morning: 'સુપ્રભાત',
    good_afternoon: 'શુભ બપોર',
    good_evening: 'શુભ સાંજ',
    good_night: 'શુભ રાત્રી',

    // Motivational
    mot_streak_fire: 'ખૂબ સારું! ચાલુ રાખો! 🔥',
    mot_high_att: 'અદ્ભુત! તમે ખૂબ મહેનતુ છો! ⭐',
    mot_high_gatha: 'ગાથા ખૂબ સારી! શીખતા રહો! 📚',
    mot_streak_ok: 'ચાલુ રાખો! 💪',
    mot_att_ok: 'ખૂબ સારું! નિયમિત આવતા રહો! 🎯',
    mot_start: 'દરેક સફર એક પગલેથી શરૂ થાય! 🚀',

    // Today's actions
    today_goals: 'આજના લક્ષ્ય',
    mark_present: 'હાજરી નોંધો',
    add_gatha: 'ગાથા ઉમેરો',
    record_learning: 'ગાથા નોંધો',
    present_check: 'હાજર ✓',
    xp_earned: 'XP મળ્યા!',
    pending_dots: 'બાકી...',
    waiting_approval: 'મંજૂરીની રાહ',
    today_gathas: 'આજની ગાથા',

    // View switching
    view_all: 'બધું જુઓ',
    back_to_me: 'મારો Account',
    viewing: 'જોઈ રહ્યા',
    actions_for_user: 'આ person માટે કરવામાં આવશે',

    // Streak
    streak_current: 'હાલની Streak',
    streak_best: 'સૌથી વધુ',
    day: 'દિવસ',
    days: 'દિવસ',
    streak_legendary: 'શ્રેષ્ઠ!',
    streak_amazing: 'અદ્ભુત!',
    streak_great: 'ખૂબ સારું!',
    streak_good: 'સારું!',
    streak_started: 'શરૂ!',
    streak_start_today: 'આજે શરૂ કરો!',

    // Attendance tracker
    att_tracker: 'હાજરી Tracker',
    att_days_absent: 'દિવસ ગેરહાજર',
    att_present: 'હાજર',
    att_working_days: 'શાળા-દિવસ',
    att_sundays_note: '* રવિવારો ગણ્યા નથી',

    // Absence messages
    abs_perfect: 'આ મહિને પૂરી હાજરી! 🌟',
    abs_great: 'ખૂબ સારું! બસ થોડા દિવસ ચૂક્યા. ચાલુ રાખો! 💪',
    abs_warn: '{n} દિવસ ગેરહાજર. હવે નિયમિત આવો! 🎯',
    abs_urgent: '{n} દિવસ ગેરહાજર! સાથીઓ આગળ છે. પાછા આવો! 🚀',
    abs_critical: '{n} દિવસ ચૂક્યા! દરેક દિવસ જરૂરી છે — આવતા રહો! 🙏',

    // Month strip
    month_glance: 'આ મહિનો',
    present: 'હાજર',
    absent: 'ગેરહાજર',
    sunday: 'રવિવાર',

    // Activity card
    your_activity: 'તમારી પ્રવૃત્તિ',
    last_visited: 'છેલ્લી હાજરી',
    today_mark: 'આજે! ✓',
    days_ago: '{n} {day} પહેલા',
    next_badge: 'આગળનો Badge',
    days_to_unlock: 'ફક્ત {n} {day} — Badge મળશે!',

    // Quick stats
    days_present: 'હાજર દિવસ',
    new_gathas: 'નવી ગાથા',
    this_month: 'આ મહિને',

    // Badges
    your_badges: 'તમારા Badges',
    no_badges_yet: 'આ મહિને કોઈ Badge નથી',
    keep_learning: 'શીખતા રહો!',
    almost_there: 'લગભગ! ચાલુ રાખો!',

    // Tips
    quick_tips: 'ઉપયોગી સૂચનો',
    tip1: 'દરરોજ હાજરી નોંધવા વાદળી button દબાવો',
    tip2: 'ગાthā umerо gar purple button tap karо',
    tip3: 'Stats tab maa tamaarī siddhi ane progress juo',
    tip4: 'Pending tab maa teacher nī mañjūrī bākī che',

    // Level modal
    tap_level: 'Level ની વિગત જોવા tap કરો',
    level_progress: 'Level Progress',
    xp_journey: 'તમારો XP પ્રવાસ',
    current_level: 'હાલનો Level',
    total_xp: 'કુલ XP',
    how_earned_xp: 'આ મહિને XP કેવી રીતે મળ્યા',
    all_levels: 'બધા Levels',
    xp_needed: 'XP જોઈએ',
    starting_level: 'પહેલો level',
    got_it: 'સમજાઈ ગ્યું! 💪',

    // Gatha modal
    edit_entry: 'ગાથા સુધારો',
    add_gatha_title: 'ગાથા ઉમેરો',
    record_progress: 'તમારી ગાથા નોંધો',
    for_user: 'માટે',
    new_learning: 'નવી ગાથા',
    revision: 'ઉજાણી',
    sutra_name: '📖 સૂત્ર નામ',
    sutra_placeholder: 'સૂત્ર નામ લખો અથવા ઉપરથી પસંદ કરો',
    sutra_help: 'જે સૂત્ર શીખ્યા કે ઉજાણ્યા તેનું નામ લખો',
    which_gatha: '📝 કઈ ગાથા',
    which_gatha_placeholder: 'દા.ત. ગાથા 1-5 અથવા 3,4,5',
    gatha_help: 'કઈ ગાથા કરી તેનો નંબર લખો (દા.ત. 1-5 અથવા 3,4,5)',
    total_count: '#️⃣ કુલ ગાથા',
    total_placeholder: 'સંખ્યા લખો',
    total_help: 'કુલ કેટલી ગાથા કરી?',
    cancel: 'રદ કરો',
    save: 'સાચવો',
    submit: 'મોકલો',

    // Months
    month_jan: 'જાન્યુ', month_feb: 'ફેબ્રુ', month_mar: 'માર્ચ', month_apr: 'એપ્રિ',
    month_may: 'મે', month_jun: 'જૂન', month_jul: 'જુ.', month_aug: 'ઓગ.',
    month_sep: 'સપ્ટે', month_oct: 'ઓક્ટો', month_nov: 'નવે', month_dec: 'ડિસે',

    // History
    my_history: 'મારો ઇતિહાસ',
    viewing_history: '{name}નો ઇતિહાસ',
    history_hint: 'લીલો = હાજર • લાલ = રવિવાર • લીલા દિવસ tap કરો વિગત જોવા',
    loading_history: 'ઇતિહાસ load થઈ રહ્યો છે...',
    new_gathas_hist: 'નવી ગાથા',
    revisions: 'ઉજાણી',
    no_new_gathas: 'કોઈ નવી ગાથા નોંધી નથી',
    no_revisions: 'કોઈ ઉજાણી નોંધી નથી',
    sutra_label: 'સૂત્ર',
    gatha_label: 'ગાથા',
    count_label: 'સંખ્યા',
    present_badge: 'હાજર ✓',
    close: 'બંધ કરો',
    try_again: 'ફરી try કરો',

    // Pending
    pending_info_title: 'Pending એટલે શું?',
    pending_info_desc: 'હાજરી નોંધ્યા કે ગાથા ઉમેર્યા બાદ teacher મંજૂર કરે છે.',
    pending_approvals: 'મંજૂરી બાકી',
    all_caught_up_big: 'બધું બરાબર છે! 🎉',
    no_pending_approvals: 'કોઈ મંજૂરી બાકી નથી',
    items_waiting: 'વસ્તુઓ મંજૂરીની રાહમાં',
    awaiting_approval: 'મંજૂરી બાકી',
    rejected_section: 'નામંજૂર',
    pending_badge: 'બાકી',
    approved_badge: 'મંજૂર',
    rejected_badge: 'નામંજૂર',
    reason_label: 'કારણ',
    gatha_type_new: 'ગાથા - નવી',
    gatha_type_revision: 'ગાથા - ઉજાણી',
    attendance_label: 'હાજરી',

    // User switcher
    switch_account: 'Account બદલો',
    members_tap: 'સભ્ય • બદલવા tap કરો',
    you_suffix: '(તમે)',
    member_tip: 'ગાથા નોંધવા અને હાજરી માટે કોઈ પણ સભ્ય પસંદ કરો',

    // Leaderboard
    loading_leaderboard: 'Leaderboard load થઈ રહ્યું છે...',
    leaderboard_error: 'Leaderboard load નથી થયું',
    leaderboard_tip: 'Month/year બદલો ત્યારે Leaderboard update થશે 🌟',
    days_present_sub: 'દિવસ હાજર',
    new_gathas_sub: 'નવી ગાથા',

    // Confirmation
    cannot_undo: 'આ undo નહીં થઈ શકે',
    delete_btn: 'હટાવો',

    // System
    loading_dashboard: 'Dashboard load થઈ રહ્યું છે...',
    offline_msg: '📵 Internet નથી. કેટલી સુવિધાઓ કામ ન કરે.',
    offline_short: '📵 Internet નથી.',
    proverb_suffix: 'ઉક્તિ',
  },
};

export default T;

