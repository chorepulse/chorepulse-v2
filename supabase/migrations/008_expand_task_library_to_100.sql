-- Expand Task Library from 55 to 100 Tasks
-- Add 45 more widely relevant tasks including spiritual, educational, health, and social activities

-- Clear existing templates and insert complete 100-task library
DELETE FROM task_templates WHERE is_system = true;

INSERT INTO task_templates (name, description, category, emoji, default_points, default_frequency, age_appropriate, popularity, is_system) VALUES
-- CLEANING TASKS (20 tasks)
('Make Your Bed', 'Straighten sheets, fluff pillows, and arrange comforter', 'cleaning', '🛏️', 5, 'daily', ARRAY['kid', 'teen', 'adult'], 95, true),
('Wash Dishes', 'Wash, dry, and put away all dishes', 'cleaning', '🍽️', 10, 'daily', ARRAY['teen', 'adult'], 92, true),
('Load Dishwasher', 'Load dirty dishes into dishwasher and start cycle', 'cleaning', '🍽️', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 90, true),
('Unload Dishwasher', 'Put away all clean dishes from dishwasher', 'cleaning', '🍽️', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 88, true),
('Wipe Kitchen Counters', 'Clean and disinfect all kitchen countertops', 'cleaning', '🧽', 5, 'daily', ARRAY['kid', 'teen', 'adult'], 85, true),
('Vacuum Living Room', 'Vacuum all floors in living room area', 'cleaning', '🧹', 12, 'weekly', ARRAY['teen', 'adult'], 88, true),
('Vacuum Bedrooms', 'Vacuum all bedroom floors', 'cleaning', '🧹', 10, 'weekly', ARRAY['teen', 'adult'], 82, true),
('Sweep Kitchen Floor', 'Sweep kitchen floor and dining area', 'cleaning', '🧹', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 80, true),
('Mop Floors', 'Mop all hard floor surfaces', 'cleaning', '🧽', 15, 'weekly', ARRAY['teen', 'adult'], 75, true),
('Dust Furniture', 'Dust all furniture surfaces in common areas', 'cleaning', '🧹', 10, 'weekly', ARRAY['teen', 'adult'], 72, true),
('Clean Bathroom', 'Clean sink, toilet, shower, and floors', 'cleaning', '🚿', 18, 'weekly', ARRAY['teen', 'adult'], 82, true),
('Scrub Toilet', 'Clean and disinfect toilet bowl and seat', 'cleaning', '🚽', 10, 'weekly', ARRAY['teen', 'adult'], 70, true),
('Clean Mirrors', 'Wipe down all mirrors in bathrooms and bedrooms', 'cleaning', '🪞', 5, 'weekly', ARRAY['kid', 'teen', 'adult'], 68, true),
('Take Out Trash', 'Empty all trash bins and take to curb', 'cleaning', '🗑️', 10, 'weekly', ARRAY['teen', 'adult'], 90, true),
('Empty Bathroom Trash', 'Empty all bathroom waste baskets', 'cleaning', '🗑️', 5, 'weekly', ARRAY['kid', 'teen'], 75, true),
('Organize Closet', 'Sort and organize clothes in closet', 'cleaning', '👔', 12, 'monthly', ARRAY['kid', 'teen', 'adult'], 65, true),
('Clean Windows', 'Wash interior and exterior windows', 'cleaning', '🪟', 15, 'monthly', ARRAY['teen', 'adult'], 60, true),
('Wipe Down Appliances', 'Clean exterior of all kitchen appliances', 'cleaning', '🧽', 8, 'weekly', ARRAY['teen', 'adult'], 70, true),
('Organize Pantry', 'Sort and organize pantry items', 'cleaning', '🗄️', 15, 'monthly', ARRAY['teen', 'adult'], 62, true),
('Clean Baseboards', 'Wipe down baseboards throughout house', 'cleaning', '🧽', 12, 'monthly', ARRAY['teen', 'adult'], 55, true),

-- COOKING & MEAL TASKS (10 tasks)
('Set Dinner Table', 'Set plates, utensils, glasses, and napkins', 'cooking', '🍽️', 5, 'daily', ARRAY['kid', 'teen'], 85, true),
('Clear Dinner Table', 'Remove all dishes and wipe down table', 'cooking', '🍽️', 5, 'daily', ARRAY['kid', 'teen'], 83, true),
('Help Prepare Breakfast', 'Assist with making breakfast', 'cooking', '🍳', 10, 'daily', ARRAY['teen', 'adult'], 70, true),
('Help with Dinner', 'Assist with meal preparation and cooking', 'cooking', '👨‍🍳', 15, 'daily', ARRAY['teen', 'adult'], 80, true),
('Pack School Lunch', 'Prepare and pack lunch for school', 'cooking', '🥪', 8, 'daily', ARRAY['kid', 'teen'], 75, true),
('Put Away Groceries', 'Help unload and organize groceries', 'cooking', '🛒', 10, 'weekly', ARRAY['kid', 'teen', 'adult'], 78, true),
('Meal Plan for Week', 'Plan meals for upcoming week', 'cooking', '📋', 15, 'weekly', ARRAY['teen', 'adult'], 60, true),
('Bake Cookies or Treats', 'Bake dessert for family', 'cooking', '🍪', 20, 'weekly', ARRAY['teen', 'adult'], 65, true),
('Prepare Healthy Snacks', 'Wash and portion fruits and vegetables', 'cooking', '🥗', 8, 'weekly', ARRAY['teen', 'adult'], 68, true),
('Clean Out Refrigerator', 'Remove expired items and wipe shelves', 'cooking', '🧊', 12, 'weekly', ARRAY['teen', 'adult'], 55, true),

-- OUTDOOR TASKS (9 tasks)
('Mow Lawn', 'Mow front and back yard, edge sidewalks', 'outdoor', '🌱', 25, 'weekly', ARRAY['teen', 'adult'], 75, true),
('Rake Leaves', 'Rake leaves in yard and bag them', 'outdoor', '🍂', 15, 'weekly', ARRAY['teen', 'adult'], 70, true),
('Water Plants', 'Water all indoor and outdoor plants', 'outdoor', '💧', 5, 'weekly', ARRAY['kid', 'teen'], 75, true),
('Pull Weeds', 'Remove weeds from garden and flower beds', 'outdoor', '🌿', 12, 'weekly', ARRAY['teen', 'adult'], 65, true),
('Shovel Snow', 'Clear driveway and walkways of snow', 'outdoor', '❄️', 20, 'daily', ARRAY['teen', 'adult'], 60, true),
('Wash Car', 'Wash and dry family vehicle', 'outdoor', '🚗', 15, 'weekly', ARRAY['teen', 'adult'], 68, true),
('Bring in Mail', 'Collect mail from mailbox daily', 'outdoor', '📬', 3, 'daily', ARRAY['kid', 'teen'], 80, true),
('Trim Hedges', 'Trim and shape bushes and hedges', 'outdoor', '✂️', 18, 'monthly', ARRAY['teen', 'adult'], 50, true),
('Sweep Porch or Patio', 'Sweep outdoor living spaces', 'outdoor', '🧹', 8, 'weekly', ARRAY['kid', 'teen', 'adult'], 62, true),

-- PET CARE TASKS (7 tasks)
('Feed Pets', 'Give pets food and fresh water', 'pet_care', '🐱', 5, 'daily', ARRAY['kid', 'teen', 'adult'], 93, true),
('Walk the Dog', 'Take dog for 20-minute walk', 'pet_care', '🐕', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 90, true),
('Clean Litter Box', 'Scoop and clean cat litter box', 'pet_care', '🐈', 10, 'daily', ARRAY['teen', 'adult'], 85, true),
('Brush Pets', 'Brush pet fur to prevent matting', 'pet_care', '🐶', 8, 'weekly', ARRAY['kid', 'teen'], 72, true),
('Clean Pet Bowls', 'Wash and refill pet food and water bowls', 'pet_care', '🥣', 5, 'daily', ARRAY['kid', 'teen'], 80, true),
('Play with Pets', 'Spend 15 minutes playing with family pets', 'pet_care', '🎾', 5, 'daily', ARRAY['kid', 'teen'], 78, true),
('Clean Pet Area', 'Clean and organize pet sleeping area', 'pet_care', '🧼', 10, 'weekly', ARRAY['teen', 'adult'], 65, true),

-- HOMEWORK & EDUCATION (8 tasks)
('Homework Time', 'Complete all homework assignments', 'homework', '📚', 15, 'daily', ARRAY['kid', 'teen'], 88, true),
('Reading Time', 'Read for 30 minutes', 'homework', '📖', 10, 'daily', ARRAY['kid', 'teen'], 82, true),
('Study for Test', 'Review and study for upcoming test', 'homework', '✏️', 20, 'weekly', ARRAY['kid', 'teen'], 75, true),
('Study Scriptures', 'Read and study religious texts for 15 minutes', 'homework', '📜', 12, 'daily', ARRAY['kid', 'teen', 'adult'], 65, true),
('Learn New Skill', 'Practice a new skill or hobby for 30 minutes', 'homework', '🎯', 15, 'weekly', ARRAY['teen', 'adult'], 58, true),
('Educational Video', 'Watch educational documentary or tutorial', 'homework', '📺', 10, 'weekly', ARRAY['kid', 'teen'], 60, true),
('Practice Math Facts', 'Complete math practice worksheet or app', 'homework', '🔢', 10, 'daily', ARRAY['kid', 'teen'], 70, true),
('Write in Journal', 'Write thoughts and reflections in journal', 'homework', '📝', 8, 'daily', ARRAY['teen', 'adult'], 55, true),

-- ORGANIZATION (6 tasks)
('Organize Room', 'Clean up and organize bedroom', 'organization', '🧺', 10, 'weekly', ARRAY['kid', 'teen'], 85, true),
('Sort Laundry', 'Separate clothes by color and type', 'organization', '👕', 8, 'weekly', ARRAY['teen', 'adult'], 75, true),
('Fold Laundry', 'Fold clean clothes and put away', 'organization', '👔', 12, 'weekly', ARRAY['teen', 'adult'], 78, true),
('Organize Backpack', 'Empty, clean, and reorganize school backpack', 'organization', '🎒', 5, 'weekly', ARRAY['kid', 'teen'], 70, true),
('Organize Desk Area', 'Clean and organize study or work desk', 'organization', '🖊️', 10, 'weekly', ARRAY['kid', 'teen', 'adult'], 72, true),
('Digital Cleanup', 'Organize computer files and delete old downloads', 'organization', '💻', 12, 'monthly', ARRAY['teen', 'adult'], 50, true),

-- MAINTENANCE (5 tasks)
('Change Light Bulbs', 'Replace any burned out light bulbs', 'maintenance', '💡', 10, 'monthly', ARRAY['teen', 'adult'], 60, true),
('Clean Air Vents', 'Dust and vacuum air vents', 'maintenance', '🌬️', 12, 'monthly', ARRAY['teen', 'adult'], 55, true),
('Clean Car Interior', 'Vacuum and clean inside of car', 'maintenance', '🚗', 15, 'monthly', ARRAY['teen', 'adult'], 65, true),
('Replace Air Filters', 'Change HVAC air filters', 'maintenance', '🔧', 15, 'monthly', ARRAY['adult'], 58, true),
('Check Smoke Alarms', 'Test smoke and carbon monoxide detectors', 'maintenance', '🔔', 10, 'monthly', ARRAY['adult'], 62, true),

-- PERSONAL CARE (10 tasks)
('Practice Instrument', 'Practice musical instrument for 30 minutes', 'personal_care', '🎸', 12, 'daily', ARRAY['kid', 'teen'], 70, true),
('Exercise or Sports', 'Physical activity for 30 minutes', 'personal_care', '⚽', 15, 'daily', ARRAY['kid', 'teen', 'adult'], 75, true),
('Brush Teeth', 'Brush teeth twice daily', 'personal_care', '🪥', 3, 'daily', ARRAY['kid', 'teen'], 95, true),
('Meditate', 'Practice meditation or mindfulness for 10 minutes', 'personal_care', '🧘', 10, 'daily', ARRAY['teen', 'adult'], 52, true),
('Pray', 'Personal prayer or reflection time', 'personal_care', '🙏', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 68, true),
('Stretch or Yoga', 'Complete stretching routine or yoga session', 'personal_care', '🤸', 10, 'daily', ARRAY['teen', 'adult'], 58, true),
('Drink Water Goal', 'Drink recommended daily water intake', 'personal_care', '💧', 5, 'daily', ARRAY['kid', 'teen', 'adult'], 72, true),
('Get Ready on Time', 'Complete morning routine without rushing', 'personal_care', '⏰', 8, 'daily', ARRAY['kid', 'teen'], 78, true),
('Skincare Routine', 'Complete morning or evening skincare', 'personal_care', '🧴', 5, 'daily', ARRAY['teen', 'adult'], 65, true),
('Gratitude Practice', 'Write down three things you are grateful for', 'personal_care', '✨', 8, 'daily', ARRAY['kid', 'teen', 'adult'], 60, true),

-- ERRANDS (4 tasks)
('Help with Grocery Shopping', 'Assist with grocery shopping trip', 'errands', '🛒', 15, 'weekly', ARRAY['teen', 'adult'], 70, true),
('Return Library Books', 'Take library books back on time', 'errands', '📚', 5, 'weekly', ARRAY['kid', 'teen'], 65, true),
('Drop Off Donations', 'Take donated items to charity', 'errands', '📦', 12, 'monthly', ARRAY['teen', 'adult'], 48, true),
('Pick Up Prescriptions', 'Collect medications from pharmacy', 'errands', '💊', 10, 'weekly', ARRAY['adult'], 55, true),

-- FAMILY & SOCIAL (8 tasks) - using 'personal_care' and 'other' categories
('Family Game Night', 'Participate in family game or activity night', 'personal_care', '🎲', 10, 'weekly', ARRAY['kid', 'teen', 'adult'], 72, true),
('Call Grandparents', 'Video call or phone call with grandparents', 'personal_care', '📞', 10, 'weekly', ARRAY['kid', 'teen', 'adult'], 68, true),
('Help Sibling', 'Help younger sibling with task or homework', 'personal_care', '👫', 12, 'weekly', ARRAY['teen', 'adult'], 65, true),
('Plan Family Activity', 'Research and plan a family outing or activity', 'personal_care', '🎉', 15, 'weekly', ARRAY['teen', 'adult'], 55, true),
('Write Thank You Note', 'Write thank you note or appreciation message', 'personal_care', '💌', 8, 'weekly', ARRAY['kid', 'teen', 'adult'], 58, true),
('Teach a Skill', 'Teach someone in family a skill you know', 'personal_care', '👨‍🏫', 15, 'monthly', ARRAY['teen', 'adult'], 50, true),
('Family Meal Together', 'Eat dinner together as a family', 'cooking', '🍽️', 5, 'daily', ARRAY['kid', 'teen', 'adult'], 80, true),
('Volunteer Work', 'Participate in community service or volunteering', 'other', '🤝', 20, 'monthly', ARRAY['teen', 'adult'], 52, true),

-- TECHNOLOGY & SCREEN TIME (4 tasks)
('Limit Screen Time', 'Stay within daily screen time limit', 'personal_care', '📱', 10, 'daily', ARRAY['kid', 'teen'], 70, true),
('Tech-Free Hour', 'Spend one hour without any screens', 'personal_care', '🚫', 12, 'daily', ARRAY['kid', 'teen', 'adult'], 62, true),
('Learn to Code', 'Complete coding lesson or tutorial', 'homework', '💻', 15, 'weekly', ARRAY['teen', 'adult'], 48, true),
('Digital Detox Day', 'Full day without social media or entertainment screens', 'personal_care', '🌿', 25, 'weekly', ARRAY['teen', 'adult'], 45, true),

-- FINANCIAL & RESPONSIBILITY (4 tasks)
('Save Allowance', 'Put portion of allowance into savings', 'organization', '💰', 10, 'weekly', ARRAY['kid', 'teen'], 65, true),
('Budget Check', 'Review spending and update budget', 'organization', '📊', 12, 'weekly', ARRAY['teen', 'adult'], 50, true),
('Plan Weekly Goals', 'Set and write down goals for the week', 'personal_care', '🎯', 10, 'weekly', ARRAY['teen', 'adult'], 58, true),
('Track Expenses', 'Log all purchases and expenses for the day', 'organization', '📝', 8, 'daily', ARRAY['teen', 'adult'], 48, true),

-- CREATIVE & HOBBIES (5 tasks)
('Art or Craft Project', 'Work on creative art or craft for 30 minutes', 'personal_care', '🎨', 12, 'weekly', ARRAY['kid', 'teen', 'adult'], 68, true),
('Build or Create', 'Work on building project (LEGO, woodwork, etc.)', 'personal_care', '🔨', 15, 'weekly', ARRAY['kid', 'teen', 'adult'], 62, true),
('Garden Work', 'Tend to plants, flowers, or vegetable garden', 'outdoor', '🌻', 12, 'weekly', ARRAY['teen', 'adult'], 58, true),
('Photography Practice', 'Take creative photos or work on photography skills', 'personal_care', '📷', 10, 'weekly', ARRAY['teen', 'adult'], 45, true),
('Cook New Recipe', 'Try making a new dish or recipe', 'cooking', '👩‍🍳', 18, 'weekly', ARRAY['teen', 'adult'], 60, true);

COMMENT ON TABLE task_templates IS 'Pre-built task templates - now includes 100 common family tasks organized by category, including spiritual, educational, health, and social activities';
