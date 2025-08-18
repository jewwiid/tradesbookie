CREATE TABLE "ai_interaction_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"session_id" varchar NOT NULL,
	"qr_code_id" varchar,
	"store_location" varchar,
	"ai_tool" text NOT NULL,
	"interaction_type" text NOT NULL,
	"user_prompt" text,
	"product_query" text,
	"product_model_1" text,
	"product_model_2" text,
	"category" text,
	"price_range" text,
	"ai_response" text NOT NULL,
	"response_tokens" integer,
	"processing_time_ms" integer,
	"confidence_score" numeric(3, 2),
	"recommended_products" jsonb DEFAULT '[]'::jsonb,
	"comparison_result" jsonb DEFAULT '{}'::jsonb,
	"analysis_data" jsonb DEFAULT '{}'::jsonb,
	"user_satisfaction" integer,
	"follow_up_questions" integer DEFAULT 0,
	"session_duration_minutes" integer,
	"action_taken" text,
	"user_agent" text,
	"ip_address" varchar,
	"device_type" text,
	"credit_used" boolean DEFAULT false,
	"error_occurred" boolean DEFAULT false,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_product_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"scan_id" integer,
	"session_id" text NOT NULL,
	"user_id" integer,
	"questions_answered" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"recommended_products" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ai_analysis" text,
	"user_selected_product" text,
	"user_engagement" text DEFAULT 'viewed',
	"booking_created" boolean DEFAULT false,
	"booking_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_tool_qr_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"tool_id" integer NOT NULL,
	"qr_code_id" varchar NOT NULL,
	"qr_code_url" text NOT NULL,
	"target_url" text NOT NULL,
	"store_location" varchar,
	"scan_count" integer DEFAULT 0,
	"last_scanned_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_tool_qr_codes_qr_code_id_unique" UNIQUE("qr_code_id")
);
--> statement-breakpoint
CREATE TABLE "ai_tools" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"credit_cost" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"icon_name" varchar DEFAULT 'Zap',
	"category" varchar DEFAULT 'general',
	"endpoint" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_tools_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "ai_usage_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar,
	"session_id" varchar NOT NULL,
	"ai_feature" text NOT NULL,
	"free_usage_count" integer DEFAULT 0,
	"paid_usage_count" integer DEFAULT 0,
	"last_free_usage" timestamp,
	"last_paid_usage" timestamp,
	"qr_code_id" varchar,
	"store_location" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "anti_manipulation" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"installer_id" integer,
	"suspicious_contact_pattern" boolean DEFAULT false,
	"rapid_booking_cancellation" boolean DEFAULT false,
	"price_discrepancy_reported" boolean DEFAULT false,
	"off_platform_contact_suspected" boolean DEFAULT false,
	"unusual_time_to_contact" boolean DEFAULT false,
	"suspicious_location_change" boolean DEFAULT false,
	"multiple_accounts_detected" boolean DEFAULT false,
	"qr_code_shared" boolean DEFAULT false,
	"qr_code_accessed_multiple_times" integer DEFAULT 0,
	"qr_code_access_locations" jsonb DEFAULT '[]'::jsonb,
	"suspicious_negotiation" boolean DEFAULT false,
	"rapid_status_changes" integer DEFAULT 0,
	"inconsistent_payment_method" boolean DEFAULT false,
	"flagged_for_review" boolean DEFAULT false,
	"admin_action_taken" text,
	"review_notes" text,
	"resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "banned_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"user_type" varchar(50) NOT NULL,
	"banned_by" integer NOT NULL,
	"ban_reason" text NOT NULL,
	"ban_type" varchar(50) DEFAULT 'permanent' NOT NULL,
	"ban_expires_at" timestamp,
	"original_user_id" integer,
	"ip_address" varchar(45),
	"additional_info" jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "banned_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"installer_id" integer,
	"qr_code" text,
	"contact_name" text NOT NULL,
	"contact_phone" text NOT NULL,
	"contact_email" text NOT NULL,
	"tv_installations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tv_size" text,
	"service_type" text,
	"wall_type" text,
	"mount_type" text,
	"needs_wall_mount" boolean DEFAULT false,
	"wall_mount_option" text,
	"addons" jsonb DEFAULT '[]'::jsonb,
	"preferred_date" timestamp,
	"preferred_time" text,
	"scheduled_date" timestamp,
	"address" text NOT NULL,
	"room_photo_url" text,
	"room_photo_compressed_url" text,
	"ai_preview_url" text,
	"completed_photo_url" text,
	"completion_photos" jsonb DEFAULT '[]'::jsonb,
	"before_after_photos" jsonb DEFAULT '[]'::jsonb,
	"photo_completion_rate" numeric(5, 2) DEFAULT '0.00',
	"quality_stars" integer DEFAULT 0,
	"photo_stars" integer DEFAULT 0,
	"review_stars" integer DEFAULT 0,
	"star_calculated_at" timestamp,
	"eligible_for_refund" boolean DEFAULT false,
	"refund_percentage" numeric(5, 2) DEFAULT '0.00',
	"refund_amount" numeric(8, 2) DEFAULT '0.00',
	"refund_processed" boolean DEFAULT false,
	"refund_processed_at" timestamp,
	"photo_storage_consent" boolean DEFAULT false,
	"room_analysis" text,
	"estimated_price" numeric(8, 2) NOT NULL,
	"estimated_addons_price" numeric(8, 2) DEFAULT '0',
	"estimated_total" numeric(8, 2) NOT NULL,
	"agreed_price" numeric(8, 2),
	"price_negotiated" boolean DEFAULT false,
	"payment_method" text,
	"paid_to_installer" boolean DEFAULT false,
	"installer_payment_date" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	"customer_notes" text,
	"installer_notes" text,
	"referral_code" text,
	"referral_discount" numeric(8, 2) DEFAULT '0.00',
	"purchase_store_code" varchar,
	"purchase_store_name" varchar,
	"retailer_code" varchar,
	"invoice_number" text,
	"invoice_session_id" text,
	"is_demo" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "bookings_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "choice_flow_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"scan_id" integer,
	"session_id" text NOT NULL,
	"current_step" integer DEFAULT 1,
	"total_steps" integer DEFAULT 5,
	"question_responses" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"flow_completed" boolean DEFAULT false,
	"completed_at" timestamp,
	"time_spent_minutes" integer,
	"exit_step" integer,
	"exit_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consultation_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"preferred_date" timestamp NOT NULL,
	"preferred_time" text NOT NULL,
	"tv_recommendation" jsonb,
	"customer_preferences" jsonb,
	"special_requests" text,
	"status" text DEFAULT 'pending',
	"installer_id" integer,
	"confirmed_date_time" timestamp,
	"store_location" text DEFAULT 'Harvey Norman Carrickmines',
	"store_address" text DEFAULT 'The Park, Carrickmines, Dublin 18, D18 R9P0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_name" text NOT NULL,
	"customer_email" text NOT NULL,
	"customer_phone" text NOT NULL,
	"consultation_type" text NOT NULL,
	"preferred_date" timestamp,
	"preferred_time" text,
	"preferred_contact_method" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"urgency" text DEFAULT 'normal',
	"existing_customer" boolean DEFAULT false,
	"status" text DEFAULT 'pending',
	"admin_notes" text,
	"scheduled_date_time" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(8, 2) NOT NULL,
	"description" text NOT NULL,
	"booking_id" integer,
	"payment_intent_id" text,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_verification" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"booking_id" integer,
	"phone_number" text NOT NULL,
	"phone_verification_code" text,
	"phone_verified" boolean DEFAULT false,
	"phone_verification_attempts" integer DEFAULT 0,
	"phone_verification_date" timestamp,
	"identity_verified" boolean DEFAULT false,
	"identity_verification_method" text,
	"ip_address" text,
	"device_fingerprint" text,
	"location_consistent" boolean DEFAULT true,
	"historical_bookings" integer DEFAULT 0,
	"previous_cancellations" integer DEFAULT 0,
	"verification_level" text DEFAULT 'basic',
	"trust_score" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"balance" numeric(8, 2) DEFAULT '0.00',
	"total_spent" numeric(8, 2) DEFAULT '0.00',
	"total_top_ups" numeric(8, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "declined_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"installer_id" integer NOT NULL,
	"booking_id" integer NOT NULL,
	"declined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "downloadable_guides" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" text NOT NULL,
	"file_url" text,
	"category" text DEFAULT 'general',
	"download_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_key" varchar(100) NOT NULL,
	"template_name" varchar(255) NOT NULL,
	"from_email" varchar(255) NOT NULL,
	"reply_to_email" varchar(255),
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"shortcodes" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "email_templates_template_key_unique" UNIQUE("template_key")
);
--> statement-breakpoint
CREATE TABLE "faq_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"question_hash" text NOT NULL,
	"use_count" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "faq_answers_question_hash_unique" UNIQUE("question_hash")
);
--> statement-breakpoint
CREATE TABLE "first_lead_vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"installer_id" integer NOT NULL,
	"is_used" boolean DEFAULT false,
	"used_for_booking_id" integer,
	"voucher_amount" numeric(8, 2) NOT NULL,
	"original_lead_fee" numeric(8, 2) NOT NULL,
	"used_at" timestamp,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "installer_service_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"installer_id" integer NOT NULL,
	"service_type_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "installer_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"installer_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(8, 2) NOT NULL,
	"description" text NOT NULL,
	"job_assignment_id" integer,
	"payment_intent_id" text,
	"status" text DEFAULT 'completed',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "installer_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"installer_id" integer NOT NULL,
	"balance" numeric(8, 2) DEFAULT '0.00',
	"total_spent" numeric(8, 2) DEFAULT '0.00',
	"total_earned" numeric(8, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "installers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text,
	"phone" text,
	"address" text,
	"service_area" text DEFAULT 'Dublin',
	"expertise" jsonb DEFAULT '[]'::jsonb,
	"bio" text,
	"years_experience" integer DEFAULT 0,
	"profile_image_url" text,
	"is_active" boolean DEFAULT true,
	"is_available" boolean DEFAULT false,
	"is_publicly_visible" boolean DEFAULT true,
	"profile_completed" boolean DEFAULT false,
	"completion_token" text,
	"completion_token_expires" timestamp,
	"admin_notes" text,
	"approval_status" varchar DEFAULT 'pending',
	"admin_score" integer,
	"admin_comments" text,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"is_vip" boolean DEFAULT false,
	"vip_granted_by" varchar,
	"vip_granted_at" timestamp,
	"vip_notes" text,
	"email_notifications" boolean DEFAULT true,
	"booking_updates" boolean DEFAULT true,
	"marketing_emails" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "installers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "job_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"installer_id" integer,
	"assigned_date" timestamp DEFAULT now(),
	"accepted_date" timestamp,
	"completed_date" timestamp,
	"status" text DEFAULT 'assigned' NOT NULL,
	"lead_fee" numeric(8, 2) DEFAULT '15.00' NOT NULL,
	"lead_fee_status" text DEFAULT 'pending',
	"lead_payment_intent_id" text,
	"lead_paid_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "lead_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_type" text NOT NULL,
	"lead_fee" numeric(8, 2) NOT NULL,
	"priority" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_quality_tracking" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer,
	"installer_id" integer,
	"phone_verified" boolean DEFAULT false,
	"phone_verification_date" timestamp,
	"email_verified" boolean DEFAULT false,
	"email_verification_date" timestamp,
	"initial_contact_made" boolean DEFAULT false,
	"initial_contact_date" timestamp,
	"customer_responded" boolean DEFAULT false,
	"customer_response_date" timestamp,
	"response_time_hours" integer,
	"quality_score" integer DEFAULT 0,
	"risk_level" text DEFAULT 'unknown',
	"suspicious_activity" boolean DEFAULT false,
	"multiple_bookings_same_details" boolean DEFAULT false,
	"rapid_cancellation" boolean DEFAULT false,
	"off_platform_negotiation" boolean DEFAULT false,
	"installer_contacted" boolean DEFAULT false,
	"installer_contact_date" timestamp,
	"installer_response_received" boolean DEFAULT false,
	"installer_ghosted" boolean DEFAULT false,
	"meeting_scheduled" boolean DEFAULT false,
	"meeting_completed" boolean DEFAULT false,
	"job_completed" boolean DEFAULT false,
	"admin_reviewed" boolean DEFAULT false,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lead_refunds" (
	"id" serial PRIMARY KEY NOT NULL,
	"installer_id" integer,
	"booking_id" integer,
	"original_lead_fee" numeric(8, 2) NOT NULL,
	"refund_reason" text NOT NULL,
	"refund_amount" numeric(8, 2) NOT NULL,
	"refund_type" text DEFAULT 'credit',
	"evidence_provided" text,
	"installer_notes" text,
	"admin_notes" text,
	"communication_logs" jsonb DEFAULT '[]'::jsonb,
	"requested_date" timestamp DEFAULT now(),
	"reviewed_date" timestamp,
	"processed_date" timestamp,
	"status" text DEFAULT 'pending',
	"reviewed_by" text,
	"automatic_approval" boolean DEFAULT false,
	"fraud_check_passed" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "onboarding_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"business_name" varchar(200),
	"county" varchar(50),
	"trade_skill" varchar(100) NOT NULL,
	"invitation_token" varchar(100) NOT NULL,
	"invitation_url" text NOT NULL,
	"email_template_used" varchar(100),
	"status" varchar(50) DEFAULT 'sent',
	"email_sent" boolean DEFAULT false,
	"email_sent_at" timestamp,
	"email_opened_at" timestamp,
	"profile_started_at" timestamp,
	"profile_completed_at" timestamp,
	"created_installer_id" integer,
	"created_by" varchar(100) NOT NULL,
	"admin_notes" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "onboarding_invitations_invitation_token_unique" UNIQUE("invitation_token")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"user_type" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "performance_refund_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"star_level" integer NOT NULL,
	"refund_percentage" numeric(5, 2) NOT NULL,
	"description" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "performance_refund_settings_star_level_unique" UNIQUE("star_level")
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'general',
	"data_type" text DEFAULT 'string',
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "platform_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "pricing_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(50) NOT NULL,
	"item_key" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"customer_price" numeric(10, 2) NOT NULL,
	"lead_fee" numeric(10, 2) NOT NULL,
	"min_tv_size" integer,
	"max_tv_size" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"qr_code_id" text NOT NULL,
	"qr_code_url" text NOT NULL,
	"price_range" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"preferred_features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_use_case" text NOT NULL,
	"recommended_brands" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"icon_emoji" text DEFAULT '📺' NOT NULL,
	"background_color" text DEFAULT '#f3f4f6' NOT NULL,
	"text_color" text DEFAULT '#000000' NOT NULL,
	"total_scans" integer DEFAULT 0,
	"total_recommendations" integer DEFAULT 0,
	"total_conversions" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_categories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "product_categories_qr_code_id_unique" UNIQUE("qr_code_id")
);
--> statement-breakpoint
CREATE TABLE "qr_code_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"session_id" text NOT NULL,
	"user_id" integer,
	"ip_address" text,
	"user_agent" text,
	"scan_location" text,
	"referrer_url" text,
	"device_type" text,
	"scanned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"referral_code" text NOT NULL,
	"referral_type" text DEFAULT 'customer' NOT NULL,
	"sales_staff_name" text,
	"sales_staff_store" text,
	"total_referrals" integer DEFAULT 0 NOT NULL,
	"total_earnings" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "referral_codes_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "referral_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"global_discount_percentage" numeric(5, 2) DEFAULT '10.00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"referral_code_id" integer NOT NULL,
	"booking_id" integer,
	"tv_setup_booking_id" integer,
	"booking_type" text DEFAULT 'regular' NOT NULL,
	"referrer_user_id" text,
	"referee_user_id" text,
	"discount_amount" numeric(8, 2) NOT NULL,
	"reward_amount" numeric(8, 2) NOT NULL,
	"subsidized_by_installer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'guide' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"brand" text,
	"company_name" text,
	"external_url" text,
	"link_text" text DEFAULT 'Learn More',
	"image_url" text,
	"icon_type" text DEFAULT 'link',
	"featured" boolean DEFAULT false,
	"priority" integer DEFAULT 0,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"published_at" timestamp DEFAULT now(),
	"expiry_date" timestamp,
	"created_by" text,
	"last_modified_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "retailer_invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar NOT NULL,
	"customer_email" varchar NOT NULL,
	"customer_name" varchar NOT NULL,
	"customer_phone" varchar,
	"purchase_date" timestamp NOT NULL,
	"tv_model" varchar,
	"tv_size" varchar,
	"purchase_amount" numeric(8, 2),
	"store_name" varchar,
	"store_code" varchar,
	"is_used_for_registration" boolean DEFAULT false,
	"retailer_code" varchar,
	"product_details" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "retailer_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"installer_id" integer NOT NULL,
	"booking_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"comment" text,
	"is_verified" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schedule_negotiations" (
	"id" serial PRIMARY KEY NOT NULL,
	"booking_id" integer NOT NULL,
	"installer_id" integer NOT NULL,
	"proposed_date" timestamp NOT NULL,
	"proposed_time_slot" varchar NOT NULL,
	"proposed_start_time" varchar,
	"proposed_end_time" varchar,
	"proposed_by" varchar NOT NULL,
	"status" varchar DEFAULT 'pending' NOT NULL,
	"proposal_message" text,
	"response_message" text,
	"proposed_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"service_type_id" integer NOT NULL,
	"total_jobs_completed" integer DEFAULT 0,
	"total_jobs_available" integer DEFAULT 0,
	"avg_earnings_low" numeric(8, 2) DEFAULT '0',
	"avg_earnings_high" numeric(8, 2) DEFAULT '0',
	"demand_level" varchar DEFAULT 'medium',
	"total_installers" integer DEFAULT 0,
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "service_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar NOT NULL,
	"name" varchar NOT NULL,
	"description" text NOT NULL,
	"icon_name" varchar NOT NULL,
	"color_scheme" jsonb NOT NULL,
	"is_active" boolean DEFAULT false,
	"setup_time_minutes" integer DEFAULT 5,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "service_types_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "solar_enquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"address" text NOT NULL,
	"county" varchar(50) NOT NULL,
	"property_type" varchar(50) NOT NULL,
	"roof_type" varchar(50) NOT NULL,
	"electricity_bill" varchar(50) NOT NULL,
	"timeframe" varchar(50) NOT NULL,
	"grants" boolean DEFAULT false,
	"additional_info" text,
	"status" varchar(50) DEFAULT 'new',
	"referral_commission" numeric(8, 2),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "store_partner_applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"store_name" varchar(200) NOT NULL,
	"business_name" varchar(200) NOT NULL,
	"website_url" varchar(500),
	"contact_name" varchar(100) NOT NULL,
	"contact_email" varchar(150) NOT NULL,
	"contact_phone" varchar(20),
	"contact_position" varchar(100),
	"business_registration_number" varchar(50),
	"vat_number" varchar(50),
	"years_in_business" varchar(20),
	"number_of_locations" varchar(10),
	"primary_products" text,
	"head_office_address" text,
	"service_areas" text,
	"monthly_invoice_volume" varchar(20),
	"installation_services_offered" boolean DEFAULT false,
	"current_installation_partners" text,
	"reason_for_joining" text,
	"invoice_format" varchar(100),
	"sample_invoice_number" varchar(50),
	"pos_system_used" varchar(100),
	"can_provide_invoice_data" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'pending',
	"admin_notes" text,
	"reviewed_by" varchar(100),
	"reviewed_at" timestamp,
	"submitted_via_invoice" varchar(50),
	"referral_source" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"subject" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"assigned_to" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ticket_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" integer NOT NULL,
	"user_id" varchar NOT NULL,
	"message" text NOT NULL,
	"is_admin_reply" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trades_person_email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_name" varchar(200) NOT NULL,
	"trade_skill" varchar(100) NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tv_setup_bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"mobile" text NOT NULL,
	"tv_brand" text NOT NULL,
	"tv_model" text NOT NULL,
	"is_smart_tv" text NOT NULL,
	"tv_os" text,
	"year_of_purchase" integer NOT NULL,
	"streaming_apps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"preferred_setup_date" timestamp,
	"additional_notes" text,
	"stripe_payment_intent_id" text,
	"payment_status" text DEFAULT 'pending',
	"payment_amount" numeric(8, 2) DEFAULT '110.00' NOT NULL,
	"original_amount" numeric(8, 2) DEFAULT '110.00' NOT NULL,
	"discount_amount" numeric(8, 2) DEFAULT '0.00' NOT NULL,
	"referral_code" text,
	"referral_code_id" integer,
	"sales_staff_name" text,
	"sales_staff_store" text,
	"setup_status" text DEFAULT 'pending',
	"setup_method" text,
	"assigned_to" text,
	"completed_at" timestamp,
	"admin_notes" text,
	"mac_address" text,
	"mac_address_provided" boolean DEFAULT false,
	"mac_address_provided_at" timestamp,
	"recommended_app" text,
	"app_download_instructions" text,
	"server_hostname" text,
	"server_username" text,
	"server_password" text,
	"m3u_url" text,
	"number_of_devices" integer DEFAULT 1,
	"subscription_expiry_date" timestamp,
	"fastmail_email" text,
	"fastmail_password" text,
	"app_username" text,
	"app_password" text,
	"credentials_provided" boolean DEFAULT false,
	"credentials_email_sent" boolean DEFAULT false,
	"credentials_sent_at" timestamp,
	"credentials_type" text,
	"credentials_payment_required" boolean DEFAULT true,
	"credentials_payment_status" text DEFAULT 'pending',
	"credentials_payment_amount" numeric(8, 2),
	"credentials_stripe_session_id" text,
	"credentials_paid_at" timestamp,
	"confirmation_email_sent" boolean DEFAULT false,
	"admin_notification_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tv_setup_bookings_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"phone" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'customer',
	"password_hash" varchar,
	"is_email_verified" boolean DEFAULT false,
	"email_verification_token" varchar,
	"verification_token_expires" timestamp,
	"retailer_invoice" varchar,
	"invoice_verified" boolean DEFAULT false,
	"registration_method" varchar DEFAULT 'oauth',
	"email_notifications" boolean DEFAULT true,
	"booking_updates" boolean DEFAULT true,
	"marketing_emails" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "video_tutorials" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration" text NOT NULL,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"thumbnail_emoji" text DEFAULT '📺',
	"level" text NOT NULL,
	"category" text DEFAULT 'general',
	"view_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wall_mount_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"mount_type" text NOT NULL,
	"price" numeric(8, 2) NOT NULL,
	"max_tv_size" integer,
	"is_active" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "wall_mount_pricing_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "ai_interaction_analytics" ADD CONSTRAINT "ai_interaction_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_product_recommendations" ADD CONSTRAINT "ai_product_recommendations_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_product_recommendations" ADD CONSTRAINT "ai_product_recommendations_scan_id_qr_code_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."qr_code_scans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_product_recommendations" ADD CONSTRAINT "ai_product_recommendations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_product_recommendations" ADD CONSTRAINT "ai_product_recommendations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_tool_qr_codes" ADD CONSTRAINT "ai_tool_qr_codes_tool_id_ai_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."ai_tools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_tracking" ADD CONSTRAINT "ai_usage_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anti_manipulation" ADD CONSTRAINT "anti_manipulation_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "anti_manipulation" ADD CONSTRAINT "anti_manipulation_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "choice_flow_tracking" ADD CONSTRAINT "choice_flow_tracking_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "choice_flow_tracking" ADD CONSTRAINT "choice_flow_tracking_scan_id_qr_code_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."qr_code_scans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_transactions" ADD CONSTRAINT "customer_transactions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_verification" ADD CONSTRAINT "customer_verification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_verification" ADD CONSTRAINT "customer_verification_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_wallets" ADD CONSTRAINT "customer_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declined_requests" ADD CONSTRAINT "declined_requests_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declined_requests" ADD CONSTRAINT "declined_requests_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "first_lead_vouchers" ADD CONSTRAINT "first_lead_vouchers_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "first_lead_vouchers" ADD CONSTRAINT "first_lead_vouchers_used_for_booking_id_bookings_id_fk" FOREIGN KEY ("used_for_booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installer_service_assignments" ADD CONSTRAINT "installer_service_assignments_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installer_service_assignments" ADD CONSTRAINT "installer_service_assignments_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installer_transactions" ADD CONSTRAINT "installer_transactions_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installer_transactions" ADD CONSTRAINT "installer_transactions_job_assignment_id_job_assignments_id_fk" FOREIGN KEY ("job_assignment_id") REFERENCES "public"."job_assignments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installer_wallets" ADD CONSTRAINT "installer_wallets_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_assignments" ADD CONSTRAINT "job_assignments_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_quality_tracking" ADD CONSTRAINT "lead_quality_tracking_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_quality_tracking" ADD CONSTRAINT "lead_quality_tracking_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_refunds" ADD CONSTRAINT "lead_refunds_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_refunds" ADD CONSTRAINT "lead_refunds_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_invitations" ADD CONSTRAINT "onboarding_invitations_created_installer_id_installers_id_fk" FOREIGN KEY ("created_installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_code_scans" ADD CONSTRAINT "qr_code_scans_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_code_scans" ADD CONSTRAINT "qr_code_scans_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_negotiations" ADD CONSTRAINT "schedule_negotiations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_negotiations" ADD CONSTRAINT "schedule_negotiations_installer_id_installers_id_fk" FOREIGN KEY ("installer_id") REFERENCES "public"."installers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_metrics" ADD CONSTRAINT "service_metrics_service_type_id_service_types_id_fk" FOREIGN KEY ("service_type_id") REFERENCES "public"."service_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");