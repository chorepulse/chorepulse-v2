-- Add 100 More Tasks to Library (Total: 200 tasks)
-- Focus on: School preparation, health & wellness, life skills, seasonal tasks,
-- special occasions, digital organization, advanced home care, and more

INSERT INTO task_templates (name, description, category, emoji, default_points, default_frequency, age_appropriate, popularity, is_system) VALUES

-- MORNING & EVENING ROUTINES (10 tasks)
('Morning Devotional', 'Start day with scripture study and reflection', 'personal_care', '🌅', 10, 'daily', ARRAY['teen', 'adult'], 55, true),
('Evening Prayer', 'End day with gratitude and prayer', 'personal_care', '🌙', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 62, true),
('Lay Out Tomorrow Clothes', 'Choose and prepare next day outfit', 'organization', '👗', 5, 'daily', ARRAY['kid', 'teen'], 68, true),
('Pack Gym Bag', 'Prepare gym or sports equipment for next day', 'organization', '🎽', 5, 'daily', ARRAY['teen', 'adult'], 52, true),
('Check Tomorrow Weather', 'Check forecast and plan appropriate attire', 'organization', '⛅', 3, 'daily', ARRAY['kid', 'teen', 'adult'], 48, true),
('Set Out Vitamins', 'Organize daily vitamins and supplements', 'personal_care', '💊', 3, 'daily', ARRAY['teen', 'adult'], 45, true),
('Prepare Coffee Maker', 'Set up coffee for automatic morning brew', 'cooking', '☕', 3, 'daily', ARRAY['adult'], 58, true),
('Turn Off All Lights', 'Check house and turn off unnecessary lights', 'maintenance', '💡', 3, 'daily', ARRAY['kid', 'teen', 'adult'], 65, true),
('Lock All Doors', 'Verify all entry doors are locked', 'maintenance', '🔒', 5, 'daily', ARRAY['teen', 'adult'], 72, true),
('Check Thermostat', 'Adjust heating/cooling for comfort and energy savings', 'maintenance', '🌡️', 3, 'daily', ARRAY['adult'], 55, true),

-- SCHOOL PREPARATION (8 tasks)
('Review Assignment Planner', 'Check and update school assignment tracker', 'homework', '📅', 8, 'daily', ARRAY['kid', 'teen'], 75, true),
('Sign Permission Slips', 'Review and sign school forms', 'homework', '📋', 5, 'weekly', ARRAY['kid', 'teen'], 62, true),
('Organize Binder', 'Sort papers, remove old work, organize sections', 'organization', '📁', 8, 'weekly', ARRAY['kid', 'teen'], 68, true),
('Sharpen Pencils', 'Prepare writing tools for school week', 'homework', '✏️', 3, 'weekly', ARRAY['kid', 'teen'], 58, true),
('Clean Out Locker', 'Organize school locker, remove trash', 'organization', '🚪', 8, 'monthly', ARRAY['teen'], 52, true),
('Return Library Books', 'Gather and return school library materials', 'errands', '📚', 5, 'weekly', ARRAY['kid', 'teen'], 65, true),
('Update Calendar', 'Add school events, tests, activities to family calendar', 'organization', '📆', 8, 'weekly', ARRAY['teen', 'adult'], 60, true),
('Check School Portal', 'Review grades and teacher messages online', 'homework', '💻', 8, 'weekly', ARRAY['teen', 'adult'], 70, true),

-- HEALTH & WELLNESS (12 tasks)
('Take Medications', 'Take prescribed medications as scheduled', 'personal_care', '💊', 10, 'daily', ARRAY['teen', 'adult'], 85, true),
('Floss Teeth', 'Floss between teeth once daily', 'personal_care', '🦷', 5, 'daily', ARRAY['teen', 'adult'], 65, true),
('Apply Sunscreen', 'Apply sun protection before outdoor activities', 'personal_care', '🧴', 5, 'daily', ARRAY['kid', 'teen', 'adult'], 55, true),
('Wash Face', 'Cleanse face morning and evening', 'personal_care', '💧', 5, 'daily', ARRAY['teen', 'adult'], 72, true),
('Deep Breathing Exercises', 'Practice 5 minutes of breathing techniques', 'personal_care', '🫁', 8, 'daily', ARRAY['teen', 'adult'], 48, true),
('Track Food Intake', 'Log meals in food diary or app', 'personal_care', '🍎', 8, 'daily', ARRAY['teen', 'adult'], 42, true),
('Weigh Yourself', 'Weekly weight check for health monitoring', 'personal_care', '⚖️', 5, 'weekly', ARRAY['teen', 'adult'], 50, true),
('Schedule Doctor Appointment', 'Book annual checkup or needed medical visit', 'errands', '🏥', 10, 'monthly', ARRAY['adult'], 65, true),
('Refill Medications', 'Order prescription refills before running out', 'errands', '💊', 8, 'monthly', ARRAY['adult'], 68, true),
('Vision Break (20-20-20)', 'Take screen breaks: look 20ft away for 20sec every 20min', 'personal_care', '👁️', 5, 'daily', ARRAY['teen', 'adult'], 45, true),
('Posture Check', 'Assess and correct sitting/standing posture', 'personal_care', '🧍', 3, 'daily', ARRAY['teen', 'adult'], 42, true),
('Moisturize Skin', 'Apply lotion to hands and body', 'personal_care', '🧴', 5, 'daily', ARRAY['teen', 'adult'], 58, true),

-- LIFE SKILLS & EDUCATION (10 tasks)
('Practice Typing', 'Complete typing practice lesson', 'homework', '⌨️', 10, 'weekly', ARRAY['kid', 'teen'], 52, true),
('Learn New Word', 'Study and use a new vocabulary word', 'homework', '📖', 8, 'daily', ARRAY['kid', 'teen'], 48, true),
('Foreign Language Practice', 'Study foreign language for 15 minutes', 'homework', '🗣️', 12, 'daily', ARRAY['teen', 'adult'], 45, true),
('Current Events Reading', 'Read and discuss one news article', 'homework', '📰', 10, 'weekly', ARRAY['teen', 'adult'], 50, true),
('Financial Literacy Lesson', 'Learn about budgeting, investing, or money management', 'homework', '💰', 15, 'weekly', ARRAY['teen', 'adult'], 55, true),
('Practice Handwriting', 'Complete cursive or print writing practice', 'homework', '✍️', 8, 'weekly', ARRAY['kid'], 45, true),
('Science Experiment', 'Conduct simple home science activity', 'homework', '🔬', 20, 'monthly', ARRAY['kid', 'teen'], 58, true),
('Map Skills Practice', 'Study geography, use atlas or map app', 'homework', '🗺️', 10, 'weekly', ARRAY['kid', 'teen'], 42, true),
('Mental Math Practice', 'Solve math problems without calculator', 'homework', '🧮', 8, 'daily', ARRAY['kid', 'teen'], 55, true),
('History Research', 'Learn about historical event or figure', 'homework', '📜', 12, 'weekly', ARRAY['kid', 'teen'], 48, true),

-- SEASONAL & OUTDOOR (8 tasks)
('Winterize Plants', 'Protect outdoor plants from cold weather', 'outdoor', '🌱', 15, 'monthly', ARRAY['teen', 'adult'], 35, true),
('Clean Gutters', 'Remove leaves and debris from rain gutters', 'maintenance', '🍂', 20, 'monthly', ARRAY['adult'], 48, true),
('Test Outdoor Lights', 'Check and replace bulbs in exterior fixtures', 'maintenance', '💡', 10, 'monthly', ARRAY['teen', 'adult'], 42, true),
('Fertilize Lawn', 'Apply seasonal lawn fertilizer', 'outdoor', '🌱', 15, 'monthly', ARRAY['teen', 'adult'], 45, true),
('Mulch Garden Beds', 'Add mulch to flower and plant beds', 'outdoor', '🌺', 18, 'monthly', ARRAY['teen', 'adult'], 38, true),
('Clean Outdoor Furniture', 'Wash and prepare patio furniture', 'outdoor', '🪑', 12, 'monthly', ARRAY['teen', 'adult'], 52, true),
('Store Seasonal Items', 'Pack away holiday or seasonal decorations', 'organization', '📦', 15, 'monthly', ARRAY['teen', 'adult'], 55, true),
('Check Emergency Supplies', 'Review and restock emergency kit', 'maintenance', '🚨', 15, 'monthly', ARRAY['adult'], 60, true),

-- HOME MAINTENANCE (10 tasks)
('Clean Dryer Vent', 'Remove lint from dryer exhaust system', 'maintenance', '🌬️', 12, 'monthly', ARRAY['adult'], 58, true),
('Test Smoke Detectors', 'Press test button on all smoke alarms', 'maintenance', '🔔', 10, 'monthly', ARRAY['adult'], 70, true),
('Change HVAC Filter', 'Replace air conditioning and heating filter', 'maintenance', '🔧', 12, 'monthly', ARRAY['adult'], 65, true),
('Clean Dishwasher Filter', 'Remove and rinse dishwasher filter', 'maintenance', '🧽', 10, 'monthly', ARRAY['adult'], 52, true),
('Descale Coffee Maker', 'Run vinegar through coffee machine', 'maintenance', '☕', 10, 'monthly', ARRAY['adult'], 48, true),
('Clean Washing Machine', 'Run cleaning cycle on washer', 'maintenance', '🧼', 10, 'monthly', ARRAY['adult'], 55, true),
('Tighten Loose Screws', 'Check furniture and fixtures for loose hardware', 'maintenance', '🔩', 10, 'monthly', ARRAY['teen', 'adult'], 42, true),
('Oil Squeaky Hinges', 'Lubricate door hinges', 'maintenance', '🚪', 8, 'monthly', ARRAY['teen', 'adult'], 45, true),
('Check Faucets for Leaks', 'Inspect all faucets and pipes for drips', 'maintenance', '💧', 8, 'monthly', ARRAY['teen', 'adult'], 50, true),
('Clean Range Hood Filter', 'Degrease and clean stove vent filter', 'cleaning', '🧽', 12, 'monthly', ARRAY['adult'], 48, true),

-- DIGITAL ORGANIZATION (8 tasks)
('Back Up Computer', 'Create backup of important files', 'organization', '💾', 15, 'weekly', ARRAY['teen', 'adult'], 55, true),
('Clear Email Inbox', 'Process and file emails to inbox zero', 'organization', '📧', 12, 'weekly', ARRAY['teen', 'adult'], 60, true),
('Update Passwords', 'Change passwords for key accounts', 'organization', '🔐', 15, 'monthly', ARRAY['teen', 'adult'], 58, true),
('Unsubscribe from Junk Email', 'Remove unwanted email subscriptions', 'organization', '📧', 10, 'monthly', ARRAY['teen', 'adult'], 52, true),
('Organize Phone Photos', 'Sort, delete, and back up phone pictures', 'organization', '📱', 15, 'monthly', ARRAY['teen', 'adult'], 68, true),
('Update Phone Apps', 'Install app updates on mobile device', 'organization', '📲', 5, 'weekly', ARRAY['teen', 'adult'], 65, true),
('Clear Browser History', 'Delete browsing data and cached files', 'organization', '🌐', 5, 'weekly', ARRAY['teen', 'adult'], 48, true),
('Organize Cloud Storage', 'Sort and clean up online file storage', 'organization', '☁️', 15, 'monthly', ARRAY['teen', 'adult'], 50, true),

-- SPECIAL OCCASIONS & SOCIAL (8 tasks)
('Send Birthday Card', 'Mail or deliver birthday greeting', 'personal_care', '🎂', 8, 'monthly', ARRAY['kid', 'teen', 'adult'], 55, true),
('Plan Gift Purchase', 'Shop for upcoming birthday or holiday gift', 'errands', '🎁', 15, 'monthly', ARRAY['teen', 'adult'], 58, true),
('Write in Gratitude Journal', 'Record things you are thankful for', 'personal_care', '📓', 8, 'daily', ARRAY['teen', 'adult'], 52, true),
('Send Encouragement Message', 'Text or call someone to brighten their day', 'personal_care', '💬', 8, 'weekly', ARRAY['teen', 'adult'], 50, true),
('Update Family Photos', 'Add new photos to family album or display', 'personal_care', '🖼️', 12, 'monthly', ARRAY['adult'], 48, true),
('Plan Date Night', 'Schedule and organize couples time', 'personal_care', '💑', 15, 'weekly', ARRAY['adult'], 62, true),
('Attend Religious Service', 'Participate in weekly worship service', 'personal_care', '⛪', 15, 'weekly', ARRAY['kid', 'teen', 'adult'], 68, true),
('Community Service Project', 'Participate in service activity', 'other', '🤝', 25, 'monthly', ARRAY['teen', 'adult'], 52, true),

-- VEHICLE CARE (6 tasks)
('Check Tire Pressure', 'Test and adjust tire inflation', 'maintenance', '🚗', 10, 'monthly', ARRAY['teen', 'adult'], 55, true),
('Check Oil Level', 'Verify engine oil is at proper level', 'maintenance', '🛢️', 8, 'monthly', ARRAY['teen', 'adult'], 52, true),
('Schedule Oil Change', 'Book vehicle maintenance appointment', 'errands', '🔧', 15, 'monthly', ARRAY['adult'], 60, true),
('Clean Car Windows', 'Wash inside and outside of all car windows', 'cleaning', '🚗', 10, 'weekly', ARRAY['teen', 'adult'], 58, true),
('Vacuum Car Seats', 'Clean vehicle interior with vacuum', 'cleaning', '🧹', 12, 'weekly', ARRAY['teen', 'adult'], 55, true),
('Organize Car Trunk', 'Remove clutter and organize trunk storage', 'organization', '🚙', 10, 'monthly', ARRAY['teen', 'adult'], 50, true),

-- FINANCIAL TASKS (6 tasks)
('Pay Bills', 'Review and pay monthly bills on time', 'organization', '💳', 15, 'monthly', ARRAY['adult'], 88, true),
('Review Bank Statement', 'Check account for errors and fraud', 'organization', '🏦', 10, 'monthly', ARRAY['teen', 'adult'], 65, true),
('Update Budget Spreadsheet', 'Record income and expenses', 'organization', '📊', 12, 'weekly', ARRAY['teen', 'adult'], 58, true),
('File Important Documents', 'Organize receipts, bills, and paperwork', 'organization', '📄', 10, 'monthly', ARRAY['adult'], 62, true),
('Check Credit Report', 'Review credit report for accuracy', 'organization', '📋', 15, 'monthly', ARRAY['adult'], 55, true),
('Donate to Charity', 'Make monthly charitable contribution', 'other', '💝', 20, 'monthly', ARRAY['adult'], 58, true),

-- ADVANCED COOKING (6 tasks)
('Meal Prep Sunday', 'Prepare meals for upcoming week', 'cooking', '🥘', 30, 'weekly', ARRAY['teen', 'adult'], 65, true),
('Make Homemade Bread', 'Bake fresh bread from scratch', 'cooking', '🍞', 25, 'weekly', ARRAY['teen', 'adult'], 42, true),
('Preserve or Can Food', 'Can fruits, vegetables, or make jam', 'cooking', '🥫', 30, 'monthly', ARRAY['adult'], 35, true),
('Fermentation Project', 'Make yogurt, kombucha, or sauerkraut', 'cooking', '🫙', 25, 'weekly', ARRAY['adult'], 32, true),
('Organize Spice Rack', 'Sort, label, and organize cooking spices', 'cooking', '🧂', 10, 'monthly', ARRAY['teen', 'adult'], 45, true),
('Create Shopping List', 'Plan and write grocery list for week', 'cooking', '📝', 8, 'weekly', ARRAY['teen', 'adult'], 72, true),

-- ADVANCED CLEANING (8 tasks)
('Deep Clean Oven', 'Scrub oven interior and racks', 'cleaning', '🔥', 20, 'monthly', ARRAY['adult'], 52, true),
('Clean Behind Appliances', 'Move and clean behind fridge and stove', 'cleaning', '🧹', 18, 'monthly', ARRAY['adult'], 45, true),
('Wash Curtains', 'Launder window treatments', 'cleaning', '🪟', 15, 'monthly', ARRAY['adult'], 42, true),
('Flip Mattress', 'Rotate or flip mattress for even wear', 'cleaning', '🛏️', 12, 'monthly', ARRAY['adult'], 48, true),
('Clean Ceiling Fans', 'Dust ceiling fan blades', 'cleaning', '🌀', 10, 'monthly', ARRAY['teen', 'adult'], 58, true),
('Wash Bed Pillows', 'Launder bed pillows and pillow protectors', 'cleaning', '🛏️', 12, 'monthly', ARRAY['adult'], 50, true),
('Steam Clean Carpets', 'Deep clean carpets with steam cleaner', 'cleaning', '🧹', 25, 'monthly', ARRAY['adult'], 45, true),
('Polish Silverware', 'Clean and polish silver items', 'cleaning', '🍴', 15, 'monthly', ARRAY['adult'], 32, true),

-- MISCELLANEOUS LIFE TASKS (10 tasks)
('Shine Shoes', 'Polish and clean dress shoes', 'organization', '👞', 8, 'weekly', ARRAY['teen', 'adult'], 38, true),
('Iron Clothes', 'Press wrinkled garments', 'organization', '👔', 10, 'weekly', ARRAY['teen', 'adult'], 55, true),
('Sew on Button', 'Repair clothing with loose buttons', 'organization', '🪡', 10, 'monthly', ARRAY['teen', 'adult'], 42, true),
('Hem Pants', 'Adjust length of trousers', 'organization', '👖', 15, 'monthly', ARRAY['teen', 'adult'], 35, true),
('Sharpen Kitchen Knives', 'Hone and sharpen cooking knives', 'maintenance', '🔪', 12, 'monthly', ARRAY['adult'], 48, true),
('Reorganize Drawer', 'Sort and tidy one drawer per week', 'organization', '🗄️', 8, 'weekly', ARRAY['teen', 'adult'], 60, true),
('Donate Unused Items', 'Gather items for charity donation', 'organization', '📦', 15, 'monthly', ARRAY['teen', 'adult'], 65, true),
('Test Internet Speed', 'Check home WiFi performance', 'maintenance', '📶', 5, 'monthly', ARRAY['teen', 'adult'], 38, true),
('Review Insurance Policies', 'Check coverage and rates annually', 'organization', '📋', 15, 'monthly', ARRAY['adult'], 52, true),
('Plan Vacation', 'Research and book family trip', 'personal_care', '✈️', 25, 'monthly', ARRAY['adult'], 68, true);

COMMENT ON TABLE task_templates IS 'Pre-built task templates - now includes 200 comprehensive family tasks organized by category';
