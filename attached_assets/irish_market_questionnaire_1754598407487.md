# AI Product Comparison System - Irish Market (Harvey Norman)

## SYSTEM PARAMETERS

### Irish Market Context
```
household_size_avg: 2.74 (vs EU 2.2)
energy_cost_sensitivity: HIGH
sustainability_preference: 77% pay premium
value_orientation: Quality-focused but price-conscious
geographic_focus: Ireland (Dublin commuting culture)
retailer: Harvey Norman (17 stores, in-store preference)
```

### AI Processing Weights
```
energy_efficiency: 35%
household_compatibility: 30% 
value_for_money: 25%
local_support: 10%
```

### Global Filters
```
min_energy_rating: A++ (appliances)
capacity_scaling: Based on household_size_avg
sustainability_scoring: Include eco-credentials
price_value_balance: Quality over cheapest
```

---

## PRODUCT CATEGORY: EARPHONES

### Question 1
```
question_id: "earphones_q1"
question_text: "What's your main use for earphones?"
options:
  - id: "commuting"
    text: "Daily commuting"
    ai_filter: ["noise_isolation", "battery_life_8h+", "quick_charge", "anc_capability"]
  - id: "fitness"
    text: "Exercise and fitness"
    ai_filter: ["ipx4_rating+", "secure_fit", "wireless_only", "sweat_resistant"]
```

### Question 2
```
question_id: "earphones_q2"
question_text: "How important is wireless convenience vs. sound quality?"
options:
  - id: "wireless_priority"
    text: "Wireless freedom is essential"
    ai_filter: ["true_wireless", "bluetooth_5.0+", "no_wires"]
  - id: "sound_priority"
    text: "Best sound quality matters most"
    ai_filter: ["wired_option", "premium_codecs", "audiophile_focused"]
```

### Question 3
```
question_id: "earphones_q3"
question_text: "What's your priority for daily use?"
options:
  - id: "battery_focus"
    text: "Long battery life"
    ai_filter: ["battery_8h+", "charging_case", "extended_use"]
  - id: "connectivity_focus"
    text: "Quick pairing and calls"
    ai_filter: ["fast_pairing", "built_in_mic", "voice_assistant", "call_quality"]
```

---

## PRODUCT CATEGORY: HEADPHONES

### Question 1
```
question_id: "headphones_q1"
question_text: "Where will you use these headphones most?"
options:
  - id: "home_entertainment"
    text: "Home entertainment and relaxation"
    ai_filter: ["over_ear", "open_back_option", "comfort_focus", "sound_quality_premium"]
  - id: "work_calls"
    text: "Work from home and calls"
    ai_filter: ["anc_capability", "microphone_quality", "comfort_extended", "professional_features"]
```

### Question 2
```
question_id: "headphones_q2"
question_text: "What's more important for your lifestyle?"
options:
  - id: "noise_cancelling"
    text: "Noise cancelling for focus"
    ai_filter: ["active_anc", "noise_reduction", "focus_oriented"]
  - id: "awareness_mode"
    text: "Awareness of surroundings"
    ai_filter: ["transparency_mode", "open_back", "ambient_aware"]
```

### Question 3
```
question_id: "headphones_q3"
question_text: "How do you prioritize comfort vs. portability?"
options:
  - id: "comfort_priority"
    text: "Maximum comfort for long sessions"
    ai_filter: ["over_ear", "premium_padding", "adjustable_fit", "extended_comfort"]
  - id: "portability_priority"
    text: "Foldable and travel-friendly"
    ai_filter: ["on_ear", "compact_design", "carrying_case", "travel_optimized"]
```

---

## PRODUCT CATEGORY: TELEVISIONS

### Question 1
```
question_id: "tv_q1"
question_text: "What best describes your viewing room?"
options:
  - id: "bright_room"
    text: "Bright living room with windows"
    ai_filter: ["high_brightness_1000nits+", "anti_glare", "led_qled_tech", "daylight_viewing"]
  - id: "controlled_room"
    text: "Controlled lighting room"
    ai_filter: ["oled_precision", "perfect_blacks", "cinema_experience", "low_light_optimized"]
```

### Question 2
```
question_id: "tv_q2"
question_text: "What's your household's main TV activity?"
options:
  - id: "family_streaming"
    text: "Family entertainment and streaming"
    ai_filter: ["smart_platform_quality", "hdr_support", "upscaling_4k", "content_focused"]
  - id: "gaming_sports"
    text: "Gaming and sports"
    ai_filter: ["low_input_lag", "high_refresh_120hz+", "gaming_features", "sport_mode"]
```

### Question 3
```
question_id: "tv_q3"
question_text: "For your household size and budget, which matters more?"
household_size_context: true
options:
  - id: "size_priority"
    text: "Largest screen size possible"
    ai_filter: ["maximize_screen_size", "budget_optimized", "size_over_features"]
  - id: "features_priority"
    text: "Latest smart features and quality"
    ai_filter: ["premium_processing", "voice_control", "smart_connectivity", "feature_rich"]
```

---

## PRODUCT CATEGORY: SOUNDBARS

### Question 1
```
question_id: "soundbar_q1"
question_text: "What describes your space and setup needs?"
options:
  - id: "simple_upgrade"
    text: "Simple TV sound upgrade"
    ai_filter: ["plug_and_play", "minimal_cables", "2.1_system", "immediate_improvement"]
  - id: "home_theatre"
    text: "Cinematic home theatre"
    ai_filter: ["multi_speaker_setup", "rear_speakers", "5.1_system+", "full_surround"]
```

### Question 2
```
question_id: "soundbar_q2"
question_text: "What's most important for your listening?"
options:
  - id: "clear_dialogue"
    text: "Clear speech and dialogue"
    ai_filter: ["voice_enhancement", "centre_channel_focus", "dialogue_mode"]
  - id: "powerful_effects"
    text: "Powerful bass and effects"
    ai_filter: ["subwoofer_emphasis", "dynamic_range", "room_filling_sound", "bass_heavy"]
```

### Question 3
```
question_id: "soundbar_q3"
question_text: "How does this fit your living space?"
irish_context: "apartment_density_high"
options:
  - id: "apartment_friendly"
    text: "Apartment-friendly volume control"
    ai_filter: ["night_mode", "neighbour_considerate", "volume_limiting", "quiet_operation"]
  - id: "full_volume_house"
    text: "House with space for full volume"
    ai_filter: ["maximum_power", "large_room_optimization", "full_dynamic_range"]
```

---

## PRODUCT CATEGORY: ROBOT_VACUUMS

### Question 1
```
question_id: "robot_vacuum_q1"
question_text: "What describes your home's floors?"
options:
  - id: "hard_floors"
    text: "Mostly hard floors"
    ai_filter: ["strong_suction", "mopping_capability", "edge_cleaning", "hard_floor_optimized"]
  - id: "carpets_rugs"
    text: "Carpets and rugs throughout"
    ai_filter: ["brush_systems", "carpet_boost", "deep_cleaning", "carpet_detection"]
```

### Question 2
```
question_id: "robot_vacuum_q2"
question_text: "How do you prefer to manage your cleaning?"
options:
  - id: "full_automation"
    text: "Set it and forget it"
    ai_filter: ["smart_mapping", "scheduling", "self_emptying", "autonomous_operation"]
  - id: "manual_control"
    text: "Control when and where it cleans"
    ai_filter: ["manual_control", "spot_cleaning", "simple_operation", "user_directed"]
```

### Question 3
```
question_id: "robot_vacuum_q3"
question_text: "What fits your household routine?"
options:
  - id: "clean_while_out"
    text: "Clean while I'm out"
    ai_filter: ["quiet_operation", "app_notifications", "secure_navigation", "scheduled_cleaning"]
  - id: "clean_while_home"
    text: "Clean when I'm home"
    ai_filter: ["quick_cycles", "voice_control", "manual_override", "flexible_timing"]
```

---

## PRODUCT CATEGORY: WASHING_MACHINES

### Question 1
```
question_id: "washing_machine_q1"
question_text: "What describes your household washing needs?"
household_size_context: true
irish_avg_household: 2.74
options:
  - id: "small_household"
    text: "Small household (1-2 people)"
    ai_filter: ["7kg_8kg_capacity", "energy_efficiency_focus", "compact_design"]
  - id: "family_household"
    text: "Family household (3+ people)"
    ai_filter: ["9kg_10kg+_capacity", "quick_wash_cycles", "family_features", "bulk_washing"]
```

### Question 2
```
question_id: "washing_machine_q2"
question_text: "What's your priority for running costs?"
irish_context: "high_energy_costs"
options:
  - id: "lowest_bills"
    text: "Lowest energy bills"
    ai_filter: ["a+++_rating", "cold_wash_programs", "eco_cycles", "energy_efficient"]
  - id: "fastest_wash"
    text: "Fastest wash times"
    ai_filter: ["quick_cycles", "powerful_cleaning", "time_efficient", "convenience_focused"]
```

### Question 3
```
question_id: "washing_machine_q3"
question_text: "What installation works for your home?"
irish_context: "kitchen_integration_common"
options:
  - id: "integrated_kitchen"
    text: "Integrated into kitchen"
    ai_filter: ["built_in_models", "quiet_operation", "aesthetic_match", "integrated_design"]
  - id: "utility_standalone"
    text: "Utility room or standalone"
    ai_filter: ["freestanding", "larger_capacity_option", "standard_installation", "utility_room"]
```

---

## PRODUCT CATEGORY: REFRIGERATORS

### Question 1
```
question_id: "refrigerator_q1"
question_text: "What capacity suits your household?"
household_size_context: true
irish_avg_household: 2.74
options:
  - id: "couple_small_family"
    text: "Couple or small family"
    ai_filter: ["300L_400L_capacity", "efficient_space_use", "compact_efficient"]
  - id: "large_family"
    text: "Large family or entertaining"
    ai_filter: ["450L+_capacity", "multiple_zones", "bulk_storage", "family_size"]
```

### Question 2
```
question_id: "refrigerator_q2"
question_text: "What's your priority for ongoing costs?"
irish_context: "high_energy_costs"
options:
  - id: "lowest_bills"
    text: "Lowest electricity bills"
    ai_filter: ["a+++_energy_rating", "inverter_technology", "energy_efficient", "low_consumption"]
  - id: "convenience_features"
    text: "Maximum convenience features"
    ai_filter: ["ice_maker", "water_dispenser", "smart_connectivity", "convenience_focused"]
```

### Question 3
```
question_id: "refrigerator_q3"
question_text: "What fits your kitchen layout?"
irish_context: "standard_kitchen_sizes"
options:
  - id: "standard_kitchen"
    text: "Standard kitchen space"
    ai_filter: ["standard_width", "counter_depth", "door_clearance", "space_efficient"]
  - id: "large_kitchen"
    text: "Large kitchen or utility area"
    ai_filter: ["american_style", "side_by_side", "maximum_capacity", "large_format"]
```

---

## PRODUCT CATEGORY: DISHWASHERS

### Question 1
```
question_id: "dishwasher_q1"
question_text: "What suits your kitchen setup?"
irish_context: "integrated_kitchen_preference"
options:
  - id: "integrated_kitchen"
    text: "Integrated into kitchen units"
    ai_filter: ["built_in", "hidden_controls", "seamless_design", "integrated_models"]
  - id: "standalone_utility"
    text: "Standalone or utility room"
    ai_filter: ["freestanding", "front_controls", "easy_access", "utility_room_suitable"]
```

### Question 2
```
question_id: "dishwasher_q2"
question_text: "What matters most for your household?"
irish_context: "high_utility_costs"
options:
  - id: "efficiency_focus"
    text: "Energy and water efficiency"
    ai_filter: ["eco_programs", "low_consumption", "a+++_rating", "efficiency_optimized"]
  - id: "speed_convenience"
    text: "Quick cleaning cycles"
    ai_filter: ["express_wash", "sanitize_cycles", "flexibility", "time_efficient"]
```

### Question 3
```
question_id: "dishwasher_q3"
question_text: "How important is noise level?"
irish_context: "apartment_living_common"
options:
  - id: "very_quiet"
    text: "Very quiet operation essential"
    ai_filter: ["44db_or_less", "insulated_design", "quiet_motors", "apartment_suitable"]
  - id: "standard_noise"
    text: "Standard noise acceptable"
    ai_filter: ["capacity_features_focus", "standard_noise_levels", "performance_over_quiet"]
```

---

## PRODUCT CATEGORY: COFFEE_MAKERS

### Question 1
```
question_id: "coffee_maker_q1"
question_text: "How much coffee does your household drink?"
household_size_context: true
options:
  - id: "light_consumption"
    text: "1-2 cups daily"
    ai_filter: ["single_serve", "pod_machines", "quick_brewing", "compact_size"]
  - id: "heavy_consumption"
    text: "Multiple cups throughout day"
    ai_filter: ["large_capacity", "programmable", "filter_machines", "continuous_brewing"]
```

### Question 2
```
question_id: "coffee_maker_q2"
question_text: "What's your priority?"
options:
  - id: "convenience_speed"
    text: "Convenience and speed"
    ai_filter: ["pod_systems", "one_touch_operation", "minimal_cleanup", "instant_coffee"]
  - id: "taste_control"
    text: "Best coffee taste and control"
    ai_filter: ["ground_coffee", "temperature_control", "brewing_options", "customizable"]
```

### Question 3
```
question_id: "coffee_maker_q3"
question_text: "How does this fit your kitchen?"
irish_context: "limited_counter_space"
options:
  - id: "limited_space"
    text: "Limited counter space"
    ai_filter: ["compact_design", "multi_function", "storable", "space_efficient"]
  - id: "dedicated_station"
    text: "Dedicated coffee station"
    ai_filter: ["full_featured", "permanent_placement", "accessories_included", "coffee_station"]
```

---

## PRODUCT CATEGORY: KETTLES

### Question 1
```
question_id: "kettle_q1"
question_text: "What capacity do you need?"
household_size_context: true
irish_avg_household: 2.74
options:
  - id: "small_capacity"
    text: "1-2 people"
    ai_filter: ["1L_1.5L_capacity", "compact", "fast_boiling", "energy_efficient"]
  - id: "large_capacity"
    text: "Family or entertaining"
    ai_filter: ["1.7L+_capacity", "large_capacity", "quick_heating", "family_size"]
```

### Question 2
```
question_id: "kettle_q2"
question_text: "What features matter most?"
irish_context: "energy_cost_conscious"
options:
  - id: "energy_efficiency"
    text: "Energy efficiency"
    ai_filter: ["variable_temperature", "eco_mode", "efficient_heating", "energy_saving"]
  - id: "speed_convenience"
    text: "Speed and convenience"
    ai_filter: ["rapid_boil", "one_touch", "easy_pour", "quick_heating"]
```

### Question 3
```
question_id: "kettle_q3"
question_text: "What design works for your kitchen?"
options:
  - id: "modern_stylish"
    text: "Modern and stylish"
    ai_filter: ["glass_stainless_steel", "led_indicators", "premium_feel", "aesthetic_focus"]
  - id: "practical_durable"
    text: "Practical and durable"
    ai_filter: ["simple_design", "easy_cleaning", "reliable_operation", "function_over_form"]
```

---

## AI RECOMMENDATION LOGIC

### Processing Flow
```
1. collect_user_responses(question_responses)
2. apply_irish_market_context(household_size, energy_focus, sustainability)
3. filter_products(ai_filters_from_responses)
4. apply_weighting_algorithm(energy_efficiency: 35%, household_compatibility: 30%, value: 25%, local_support: 10%)
5. rank_recommendations(filtered_products, weighted_scores)
6. return_top_matches(limit: 3, include_reasoning: true)
```

### Product Filtering Rules
```
energy_rating_minimum: "A++" (for appliances)
capacity_scaling: Based on irish_avg_household (2.74)
sustainability_bonus: +10% score for eco-certified products
local_service_bonus: +5% score for Harvey Norman supported brands
price_value_optimization: Quality over cheapest options
```

### Response Processing
```
for each question_response:
  extract ai_filters from selected option
  apply irish_context modifiers if present
  combine with household_size_context if applicable
  
final_filters = combine_all_filters(question_responses)
product_matches = database.filter(final_filters)
```

### Recommendation Output Format
```json
{
  "recommendations": [
    {
      "product_id": "string",
      "product_name": "string",
      "brand": "string",
      "model": "string",
      "match_score": 0.95,
      "price": "€XXX",
      "key_features": ["feature1", "feature2", "feature3"],
      "why_recommended": "Based on your responses about [specific needs], this product excels at [specific benefits]",
      "irish_market_fit": "Energy efficient (A+++), suitable for Irish household size (2.74 avg)",
      "harvey_norman_stock": true,
      "warranty_service": "2 year + Harvey Norman service"
    }
  ],
  "comparison_factors": ["energy_efficiency", "capacity_match", "features_alignment"],
  "irish_market_considerations": "Selected for Irish energy costs and household patterns"
}
```

### Implementation Guidelines

#### For Tracebook.ie Integration
```
questionnaire_format: Progressive web app
completion_target: >25% (simplified questions)
mobile_optimized: true
offline_capable: false (requires real-time product data)
```

#### Quality Metrics
```
recommendation_accuracy: >85% customer satisfaction
energy_efficiency_match: >90% products meet A++ minimum
household_size_compatibility: >85% capacity appropriate for user
completion_rate: >25% of started questionnaires
```

#### Irish Market Adaptations
```
currency: EUR (€)
energy_labels: EU energy rating system
delivery_areas: Republic of Ireland + Northern Ireland
local_services: Harvey Norman 17 store network
payment_methods: Include Irish banking preferences
```

---

## USAGE INSTRUCTIONS FOR LLM

When processing a customer questionnaire:

1. **Extract all ai_filters** from selected options across all questions
2. **Apply irish_context modifiers** where present
3. **Scale recommendations** based on household_size_context if applicable
4. **Weight final scores** using irish market priorities (energy 35%, household 30%, value 25%, support 10%)
5. **Filter minimum standards** (A++ energy rating, appropriate capacity)
6. **Return top 3 matches** with detailed reasoning linking back to customer responses
7. **Include irish market fit** explanation in recommendation text
8. **Highlight Harvey Norman advantages** (local service, warranty, availability)

This system prioritizes Irish consumer needs: energy efficiency, appropriate household sizing, value for money, and local support - while maintaining simplicity for high completion rates.