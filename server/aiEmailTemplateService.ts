import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Trade skills with their specific relevance to TV installation
const TRADE_SKILL_CONTEXTS = {
  carpenter: {
    skills: "wall mounting, custom installations, furniture assembly, structural modifications",
    tvRelevance: "Perfect for custom TV mounting solutions, building media centers, and wall modifications",
    earnings: "€150-300 per installation",
    specialties: ["Custom mounting brackets", "Built-in media centers", "Wall reinforcement", "Cable hiding solutions"]
  },
  electrician: {
    skills: "electrical work, cable management, power outlets, smart home wiring",
    tvRelevance: "Essential for power outlet installation, cable management, and smart TV electrical setup",
    earnings: "€200-400 per installation",
    specialties: ["Power outlet installation", "Cable routing", "Smart TV wiring", "Electrical safety"]
  },
  plumber: {
    skills: "drilling, wall mounting, basic installations, pipe work",
    tvRelevance: "Strong drilling skills translate perfectly to secure TV wall mounting",
    earnings: "€120-250 per installation",
    specialties: ["Secure wall mounting", "Masonry drilling", "Wall assessment", "Basic installations"]
  },
  joiner: {
    skills: "woodwork, custom installations, built-in solutions, furniture",
    tvRelevance: "Expert at creating custom TV mounting solutions and built-in entertainment units",
    earnings: "€180-350 per installation",
    specialties: ["Custom mounting solutions", "Built-in installations", "Furniture integration", "Precision fitting"]
  },
  painter: {
    skills: "wall assessment, surface preparation, finishing work, decorating",
    tvRelevance: "Knowledge of wall types and finishing work around TV mounts",
    earnings: "€100-200 per installation",
    specialties: ["Wall assessment", "Finishing work", "Paint touch-ups", "Aesthetic integration"]
  },
  general_handyman: {
    skills: "all-round maintenance, basic installations, problem-solving, tool expertise",
    tvRelevance: "Versatile skills perfect for comprehensive TV installation services",
    earnings: "€150-280 per installation",
    specialties: ["Complete installations", "Problem-solving", "Multi-trade skills", "Customer service"]
  },
  tv_specialist: {
    skills: "professional TV installation, mounting systems, cable management, setup",
    tvRelevance: "Specialized expertise in all aspects of TV installation and setup",
    earnings: "€200-450 per installation",
    specialties: ["Professional mounting", "System optimization", "Advanced setups", "Troubleshooting"]
  }
};

// Preset email templates for each trade skill
export const PRESET_TEMPLATES = {
  carpenter: {
    subject: "Expand Your Carpentry Business with TV Installation Services",
    content: `Hi {{name}},

As a skilled carpenter, you already have the perfect foundation to earn additional income through TV installation services. Your expertise in wall mounting, custom installations, and structural work makes you an ideal candidate for our growing network of installers.

**Why TV Installation is Perfect for Carpenters:**
• Use your existing wall mounting and drilling skills
• Create custom mounting solutions and media centers
• Average earnings of €150-300 per installation
• Flexible work that complements your existing business

**What tradesbook.ie Offers:**
• Steady stream of qualified leads in your area
• Professional booking and payment system
• Full customer support and scheduling
• No upfront costs or fees

**Your Specialized Services Could Include:**
• Custom TV mounting and brackets
• Built-in entertainment centers
• Cable hiding and management solutions
• Wall reinforcement for large TVs

Ready to expand your business? Join our network today: {{invitationUrl}}

Best regards,
The tradesbook.ie Team

P.S. With your carpentry skills, you could be earning an extra €1,500-3,000 per month with just 10-20 installations!`
  },
  
  electrician: {
    subject: "Perfect Opportunity for Electricians: TV Installation Services",
    content: `Hi {{name}},

Your electrical expertise makes you one of the most sought-after professionals for TV installation services. Customers specifically request electricians for the technical aspects of modern TV setups.

**Why Electricians Excel at TV Installation:**
• Power outlet installation and electrical safety
• Smart TV wiring and home automation integration
• Cable management and routing expertise
• Average earnings of €200-400 per installation

**Growing Demand for Your Skills:**
• Smart TVs require proper electrical setup
• Customers want hidden cables and professional wiring
• Power outlet placement is crucial for clean installations
• Home theater systems need electrical expertise

**tradesbook.ie Partnership Benefits:**
• High-quality leads from customers who value electrical expertise
• Premium pricing for electrical work
• Professional platform with automated booking
• Full payment processing and customer support

**Expand Your Services:**
• TV installation with electrical work
• Smart home integration
• Cable management systems
• Power outlet installations

Join our network: {{invitationUrl}}

Best regards,
The tradesbook.ie Team

P.S. Electrical work commands premium rates - many of our electrician partners earn €300+ per installation!`
  },

  plumber: {
    subject: "Put Your Drilling Skills to Work: TV Installation Opportunity",
    content: `Hi {{name}},

Your plumbing background has given you invaluable skills that translate perfectly to TV installation work. Your expertise with drilling, wall assessment, and secure mounting makes you an ideal candidate for our installer network.

**How Your Plumbing Skills Apply:**
• Expert drilling techniques for secure mounting
• Wall structure knowledge and assessment
• Tool expertise and precision work
• Average earnings of €120-250 per installation

**Why TV Installation is a Natural Fit:**
• Use your existing drilling and mounting skills
• No complex plumbing systems - just straightforward installations
• Flexible work that fits around your plumbing schedule
• Additional income stream with minimal learning curve

**tradesbook.ie Support:**
• Qualified leads in your local area
• Easy online booking and payment system
• Customer service handled for you
• Flexible scheduling around your existing work

**Your Installation Services:**
• Secure TV wall mounting
• Basic cable management
• Wall assessment and preparation
• Professional, clean installations

Ready to diversify your income? {{invitationUrl}}

Best regards,
The tradesbook.ie Team

P.S. Many plumbers in our network report TV installation as their most straightforward and profitable side work!`
  },

  joiner: {
    subject: "Custom TV Solutions: Perfect Work for Skilled Joiners",
    content: `Hi {{name}},

Your joinery skills are in high demand for premium TV installation services. Customers increasingly want custom mounting solutions and built-in entertainment systems that only skilled joiners can provide.

**Premium Opportunities for Joiners:**
• Custom mounting brackets and solutions
• Built-in entertainment centers and cabinets
• Furniture integration and bespoke work
• Average earnings of €180-350 per installation

**Why Your Skills Command Premium Rates:**
• Precision fitting and custom solutions
• High-end residential and commercial projects
• Integration with existing furniture and décor
• Customers value craftsmanship and attention to detail

**tradesbook.ie Partnership:**
• Access to customers seeking quality work
• Premium pricing for custom solutions
• Professional platform with payment processing
• Focus on high-value installations

**Specialized Services You Can Offer:**
• Custom TV mounting solutions
• Built-in media center construction
• Furniture modification and integration
• Precision cable management systems

Join our premium installer network: {{invitationUrl}}

Best regards,
The tradesbook.ie Team

P.S. Our joiner partners often secure repeat customers for additional carpentry work - it's a great way to grow your client base!`
  },

  painter: {
    subject: "Complement Your Painting Work with TV Installation",
    content: `Hi {{name}},

Your expertise in wall assessment and finishing work makes you a valuable addition to our TV installation network. Many customers need both services, creating perfect cross-selling opportunities.

**How Your Skills Apply:**
• Wall type identification and assessment
• Surface preparation and finishing
• Paint touch-ups around installations
• Average earnings of €100-200 per installation

**Perfect Complement to Painting Work:**
• Offer TV installation to existing painting customers
• Wall knowledge gives you an advantage
• Finishing skills ensure professional results
• Additional income from your client base

**tradesbook.ie Benefits:**
• Leads that often need painting work too
• Flexible scheduling around painting projects
• Professional booking platform
• Customer service and payment processing

**Services You Can Provide:**
• Basic TV wall mounting
• Wall assessment and preparation
• Finishing work around installations
• Aesthetic integration with room décor

Start earning extra income: {{invitationUrl}}

Best regards,
The tradesbook.ie Team

P.S. Many customers book TV installation first, then request painting work - it's a great way to find new clients!`
  },

  general_handyman: {
    subject: "Perfect Fit: TV Installation for Skilled Handymen",
    content: `Hi {{name}},

Your all-round maintenance skills and problem-solving expertise make you ideal for TV installation work. This service perfectly complements your existing handyman business.

**Why TV Installation Suits Handymen:**
• Uses your existing tool skills and experience
• Problem-solving abilities highly valued
• Combines multiple trade skills in one service
• Average earnings of €150-280 per installation

**Growing Market Opportunity:**
• Increasing demand for TV installation services
• Customers prefer experienced handymen
• Steady work year-round
• Great addition to your service portfolio

**tradesbook.ie Partnership:**
• Qualified leads in your area
• Professional booking and payment system
• Customer support included
• Flexible scheduling

**Complete Service Offering:**
• TV mounting and installation
• Cable management and hiding
• Problem-solving for complex setups
• Customer service and satisfaction

Ready to expand your services? {{invitationUrl}}

Best regards,
The tradesbook.ie Team

P.S. Handymen often become our most successful installers due to their versatility and customer service skills!`
  },

  tv_specialist: {
    subject: "Join Ireland's Premier TV Installation Network",
    content: `Hi {{name}},

Your specialized TV installation expertise is exactly what we're looking for. Join our network of professional installers and access a steady stream of quality customers.

**Professional TV Installation Opportunities:**
• Premium installations and complex setups
• Smart TV and home theater systems
• Advanced mounting and cable management
• Average earnings of €200-450 per installation

**Why Join tradesbook.ie:**
• Consistent flow of qualified leads
• Professional platform and customer base
• Premium pricing for specialist work
• No lead generation costs or marketing needed

**Advanced Services You Can Offer:**
• Professional TV mounting systems
• Home theater installation and optimization
• Smart TV setup and integration
• Advanced troubleshooting and support

**Network Benefits:**
• Focus on installation work, not marketing
• Professional customer base
• Automated booking and payment processing
• Quality leads that value expertise

Join our specialist network: {{invitationUrl}}

Best regards,
The tradesbook.ie Team

P.S. Our specialist installers average 15-25 installations per month - focus on what you do best while we handle the business side!`
  }
};

interface EmailTemplateRequest {
  tradeSkill: string;
  templateName?: string;
  tone?: 'professional' | 'friendly' | 'persuasive';
  focus?: 'earnings' | 'flexibility' | 'skills' | 'opportunity';
}

interface EmailTemplateResponse {
  subject: string;
  content: string;
  templateName?: string;
}

/**
 * Generate AI-powered email template for tradesperson onboarding
 */
export async function generateEmailTemplate(request: EmailTemplateRequest): Promise<EmailTemplateResponse> {
  const { tradeSkill, templateName, tone = 'professional', focus = 'opportunity' } = request;
  
  const context = TRADE_SKILL_CONTEXTS[tradeSkill as keyof typeof TRADE_SKILL_CONTEXTS];
  
  if (!context) {
    throw new Error(`Unknown trade skill: ${tradeSkill}`);
  }

  const prompt = `Create a compelling email template for inviting a ${context.skills} professional to join our TV installation service network (tradesbook.ie).

Context:
- Target: ${tradeSkill} professionals in Ireland
- Their skills: ${context.skills}
- TV installation relevance: ${context.tvRelevance}
- Potential earnings: ${context.earnings}
- Specialties they can offer: ${context.specialties.join(', ')}

Requirements:
- Tone: ${tone}
- Primary focus: ${focus}
- Include specific benefits for their trade skill
- Mention realistic earning potential
- Include personalization variables: {{name}}, {{tradeSkill}}, {{invitationUrl}}
- Professional but approachable language
- Irish market context
- Call-to-action to join the network
- Length: 150-300 words
- Format: Professional email with clear structure

Focus areas based on selection:
- earnings: Emphasize income potential and financial benefits
- flexibility: Highlight work-life balance and scheduling flexibility  
- skills: Focus on how their existing skills translate perfectly
- opportunity: Emphasize business growth and market opportunity

Please respond with JSON in this exact format:
{
  "subject": "Compelling email subject line",
  "content": "Full email content with proper formatting and line breaks",
  "templateName": "Suggested template name"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at creating compelling business invitation emails for tradesperson recruitment. Focus on authentic benefits and realistic opportunities."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      subject: result.subject || `Join our ${tradeSkill} network - tradesbook.ie`,
      content: result.content || 'AI generation failed. Please try again.',
      templateName: result.templateName || templateName || `AI Generated ${tradeSkill} Template`
    };
  } catch (error) {
    console.error('Error generating AI email template:', error);
    throw new Error('Failed to generate email template. Please try again.');
  }
}

/**
 * Get preset template for a specific trade skill
 */
export function getPresetTemplate(tradeSkill: string): EmailTemplateResponse | null {
  const preset = PRESET_TEMPLATES[tradeSkill as keyof typeof PRESET_TEMPLATES];
  
  if (!preset) {
    return null;
  }
  
  return {
    subject: preset.subject,
    content: preset.content,
    templateName: `${tradeSkill.charAt(0).toUpperCase() + tradeSkill.slice(1)} Preset Template`
  };
}

/**
 * Get all available preset templates
 */
export function getAllPresetTemplates(): Record<string, EmailTemplateResponse> {
  const presets: Record<string, EmailTemplateResponse> = {};
  
  Object.entries(PRESET_TEMPLATES).forEach(([skill, template]) => {
    presets[skill] = {
      subject: template.subject,
      content: template.content,
      templateName: `${skill.charAt(0).toUpperCase() + skill.slice(1)} Preset Template`
    };
  });
  
  return presets;
}