/**
 * AI Content Generation System
 * Handles automated content creation for marketing campaigns, product descriptions,
 * social media posts, and customer communications using AI
 *
 * Features:
 * - Product description generation
 * - Marketing campaign content creation
 * - Social media post generation
 * - Customer communication templates
 * - SEO-optimized content
 * - Multi-language support
 * - Content personalization
 * - A/B testing content variants
 */

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { db } from "./database"

export class AIContentGenerator {
  private model = openai("gpt-4")

  /**
   * Generate product description for homeopathy products
   */
  async generateProductDescription(productData: {
    name: string
    category: string
    potency?: string
    indications?: string[]
    ingredients?: string[]
    target_audience?: string
    tone?: "professional" | "friendly" | "scientific"
  }): Promise<string> {
    const prompt = `
      Create a compelling product description for a homeopathy product with the following details:
      
      Product Name: ${productData.name}
      Category: ${productData.category}
      ${productData.potency ? `Potency: ${productData.potency}` : ""}
      ${productData.indications ? `Indications: ${productData.indications.join(", ")}` : ""}
      ${productData.ingredients ? `Key Ingredients: ${productData.ingredients.join(", ")}` : ""}
      ${productData.target_audience ? `Target Audience: ${productData.target_audience}` : ""}
      
      Requirements:
      - Write in a ${productData.tone || "professional"} tone
      - Include benefits and usage instructions
      - Mention safety and natural healing aspects
      - Keep it between 150-250 words
      - Make it SEO-friendly
      - Include a compelling call-to-action
      - Ensure compliance with homeopathy regulations
      
      Format the response as a clean product description without any markdown formatting.
    `

    const { text } = await generateText({
      model: this.model,
      prompt: prompt,
      maxTokens: 500,
    })

    // Log content generation
    await this.logContentGeneration("product_description", {
      product_name: productData.name,
      category: productData.category,
      content_length: text.length,
    })

    return text
  }

  /**
   * Generate marketing campaign content
   */
  async generateCampaignContent(campaignData: {
    type: "promotional" | "educational" | "seasonal" | "health_awareness"
    channel: "whatsapp" | "sms" | "email" | "social_media"
    target_audience: string
    product_focus?: string
    occasion?: string
    tone?: "urgent" | "friendly" | "informative" | "promotional"
    max_length?: number
  }): Promise<string> {
    const maxLength = campaignData.max_length || (campaignData.channel === "sms" ? 160 : 500)

    const prompt = `
      Create ${campaignData.type} marketing content for ${campaignData.channel} with these specifications:
      
      Campaign Type: ${campaignData.type}
      Channel: ${campaignData.channel}
      Target Audience: ${campaignData.target_audience}
      ${campaignData.product_focus ? `Product Focus: ${campaignData.product_focus}` : ""}
      ${campaignData.occasion ? `Occasion: ${campaignData.occasion}` : ""}
      Tone: ${campaignData.tone || "friendly"}
      Max Length: ${maxLength} characters
      
      Requirements:
      - Focus on homeopathy and natural healing
      - Include a clear call-to-action
      - Make it engaging and persuasive
      - Ensure it's appropriate for the target channel
      - Include personalization placeholders like {{customer_name}} where relevant
      - For WhatsApp/SMS: Keep it conversational and direct
      - For Email: Include subject line suggestion
      - For Social Media: Make it shareable and engaging
      
      ${campaignData.channel === "email" ? "Provide both subject line and email content." : ""}
      
      Format the response as clean text without markdown formatting.
    `

    const { text } = await generateText({
      model: this.model,
      prompt: prompt,
      maxTokens: 600,
    })

    // Log content generation
    await this.logContentGeneration("campaign_content", {
      campaign_type: campaignData.type,
      channel: campaignData.channel,
      target_audience: campaignData.target_audience,
      content_length: text.length,
    })

    return text
  }

  /**
   * Generate social media posts
   */
  async generateSocialMediaPost(postData: {
    platform: "instagram" | "facebook" | "twitter" | "linkedin"
    content_type: "product_highlight" | "health_tip" | "testimonial" | "educational" | "promotional"
    product_name?: string
    health_topic?: string
    target_audience?: string
    include_hashtags?: boolean
    include_cta?: boolean
  }): Promise<{ content: string; hashtags?: string[]; caption?: string }> {
    const prompt = `
      Create a ${postData.content_type} social media post for ${postData.platform} about homeopathy:
      
      Platform: ${postData.platform}
      Content Type: ${postData.content_type}
      ${postData.product_name ? `Product: ${postData.product_name}` : ""}
      ${postData.health_topic ? `Health Topic: ${postData.health_topic}` : ""}
      ${postData.target_audience ? `Target Audience: ${postData.target_audience}` : ""}
      
      Requirements:
      - Make it engaging and informative
      - Focus on natural healing and wellness
      - Keep it appropriate for the platform's audience
      - Include educational value
      - Make it shareable and relatable
      ${postData.include_hashtags ? "- Include relevant hashtags" : ""}
      ${postData.include_cta ? "- Include a clear call-to-action" : ""}
      
      Platform-specific requirements:
      - Instagram: Visual-focused, story-telling approach
      - Facebook: Community-focused, longer form acceptable
      - Twitter: Concise, trending topics, conversational
      - LinkedIn: Professional, educational, industry insights
      
      Provide the response in JSON format with 'content' and optionally 'hashtags' array.
    `

    const { text } = await generateText({
      model: this.model,
      prompt: prompt,
      maxTokens: 400,
    })

    let result
    try {
      result = JSON.parse(text)
    } catch (error) {
      // Fallback if JSON parsing fails
      result = { content: text }
    }

    // Log content generation
    await this.logContentGeneration("social_media_post", {
      platform: postData.platform,
      content_type: postData.content_type,
      product_name: postData.product_name,
      content_length: result.content?.length || 0,
    })

    return result
  }

  /**
   * Generate customer communication templates
   */
  async generateCustomerTemplate(templateData: {
    type: "welcome" | "order_confirmation" | "shipping_update" | "follow_up" | "support_response"
    channel: "email" | "sms" | "whatsapp"
    tone: "formal" | "friendly" | "caring" | "professional"
    personalization_fields?: string[]
  }): Promise<string> {
    const prompt = `
      Create a ${templateData.type} customer communication template for ${templateData.channel}:
      
      Template Type: ${templateData.type}
      Channel: ${templateData.channel}
      Tone: ${templateData.tone}
      ${templateData.personalization_fields ? `Personalization Fields: ${templateData.personalization_fields.join(", ")}` : ""}
      
      Requirements:
      - Use a ${templateData.tone} tone throughout
      - Include appropriate personalization placeholders
      - Make it specific to homeopathy business context
      - Ensure it's helpful and informative
      - Include relevant next steps or actions
      - Keep it concise but complete
      - Add placeholders for dynamic content like {{customer_name}}, {{order_id}}, etc.
      
      Template-specific requirements:
      - Welcome: Introduce the business, set expectations, provide helpful resources
      - Order Confirmation: Confirm details, provide tracking info, set delivery expectations
      - Shipping Update: Update on status, provide tracking, estimated delivery
      - Follow-up: Check satisfaction, request feedback, offer support
      - Support Response: Address concerns, provide solutions, maintain caring tone
      
      Format as a clean template without markdown formatting.
    `

    const { text } = await generateText({
      model: this.model,
      prompt: prompt,
      maxTokens: 500,
    })

    // Log content generation
    await this.logContentGeneration("customer_template", {
      template_type: templateData.type,
      channel: templateData.channel,
      tone: templateData.tone,
      content_length: text.length,
    })

    return text
  }

  /**
   * Generate SEO-optimized blog content
   */
  async generateBlogContent(blogData: {
    topic: string
    target_keywords: string[]
    content_type: "how_to" | "benefits" | "comparison" | "case_study" | "news"
    target_audience: string
    word_count?: number
  }): Promise<{ title: string; content: string; meta_description: string }> {
    const wordCount = blogData.word_count || 800

    const prompt = `
      Create SEO-optimized blog content about homeopathy with these specifications:
      
      Topic: ${blogData.topic}
      Content Type: ${blogData.content_type}
      Target Keywords: ${blogData.target_keywords.join(", ")}
      Target Audience: ${blogData.target_audience}
      Word Count: ${wordCount} words
      
      Requirements:
      - Create an engaging, SEO-friendly title
      - Write informative, well-structured content
      - Naturally incorporate target keywords
      - Include subheadings for better readability
      - Provide actionable insights and tips
      - Maintain scientific accuracy about homeopathy
      - Include a compelling meta description (150-160 characters)
      - End with a clear call-to-action
      
      Content Type Guidelines:
      - How-to: Step-by-step instructions and practical advice
      - Benefits: Focus on advantages and positive outcomes
      - Comparison: Compare different approaches or products
      - Case Study: Real examples and success stories
      - News: Latest developments and industry updates
      
      Provide the response in JSON format with 'title', 'content', and 'meta_description'.
    `

    const { text } = await generateText({
      model: this.model,
      prompt: prompt,
      maxTokens: 1500,
    })

    let result
    try {
      result = JSON.parse(text)
    } catch (error) {
      // Fallback if JSON parsing fails
      const lines = text.split("\n")
      result = {
        title: lines[0] || blogData.topic,
        content: text,
        meta_description: `Learn about ${blogData.topic} in homeopathy. Expert insights and practical advice.`,
      }
    }

    // Log content generation
    await this.logContentGeneration("blog_content", {
      topic: blogData.topic,
      content_type: blogData.content_type,
      word_count: result.content?.split(" ").length || 0,
      target_keywords: blogData.target_keywords,
    })

    return result
  }

  /**
   * Generate A/B test content variants
   */
  async generateContentVariants(originalContent: string, variantCount = 2): Promise<string[]> {
    const prompt = `
      Create ${variantCount} different variants of the following marketing content for A/B testing:
      
      Original Content: "${originalContent}"
      
      Requirements:
      - Maintain the same core message and call-to-action
      - Vary the tone, structure, and wording
      - Keep the same approximate length
      - Make each variant distinct but equally compelling
      - Ensure all variants are appropriate for homeopathy marketing
      - Focus on different emotional appeals or benefits
      
      Provide the variants as a JSON array of strings.
    `

    const { text } = await generateText({
      model: this.model,
      prompt: prompt,
      maxTokens: 600,
    })

    let variants
    try {
      variants = JSON.parse(text)
    } catch (error) {
      // Fallback if JSON parsing fails
      variants = [originalContent] // Return original if parsing fails
    }

    // Log content generation
    await this.logContentGeneration("content_variants", {
      original_length: originalContent.length,
      variant_count: variants.length,
      total_variants_length: variants.reduce((sum: number, v: string) => sum + v.length, 0),
    })

    return variants
  }

  /**
   * Generate personalized content based on customer data
   */
  async generatePersonalizedContent(
    customerData: {
      name: string
      age?: number
      health_interests?: string[]
      purchase_history?: string[]
      location?: string
      preferred_communication?: string
    },
    contentType: "recommendation" | "health_tip" | "product_suggestion",
  ): Promise<string> {
    const prompt = `
      Create personalized ${contentType} content for a homeopathy customer:
      
      Customer Profile:
      - Name: ${customerData.name}
      ${customerData.age ? `- Age: ${customerData.age}` : ""}
      ${customerData.health_interests ? `- Health Interests: ${customerData.health_interests.join(", ")}` : ""}
      ${customerData.purchase_history ? `- Previous Purchases: ${customerData.purchase_history.join(", ")}` : ""}
      ${customerData.location ? `- Location: ${customerData.location}` : ""}
      ${customerData.preferred_communication ? `- Communication Style: ${customerData.preferred_communication}` : ""}
      
      Content Type: ${contentType}
      
      Requirements:
      - Address the customer by name
      - Make it relevant to their interests and history
      - Provide valuable, actionable advice
      - Keep it personal and caring
      - Include specific homeopathy recommendations when appropriate
      - Maintain a helpful, non-pushy tone
      - End with a gentle call-to-action
      
      Content Guidelines:
      - Recommendation: Suggest products or treatments based on their profile
      - Health Tip: Provide seasonal or condition-specific wellness advice
      - Product Suggestion: Recommend new or complementary products
      
      Format as clean, personalized content without markdown.
    `

    const { text } = await generateText({
      model: this.model,
      prompt: prompt,
      maxTokens: 400,
    })

    // Log content generation
    await this.logContentGeneration("personalized_content", {
      customer_name: customerData.name,
      content_type: contentType,
      health_interests: customerData.health_interests,
      content_length: text.length,
    })

    return text
  }

  /**
   * Log content generation events for analytics
   */
  private async logContentGeneration(contentType: string, metadata: any): Promise<void> {
    const query = `
      INSERT INTO ai_content_logs (content_type, metadata, created_at)
      VALUES (?, ?, NOW())
    `

    await db.execute(query, [contentType, JSON.stringify(metadata)])
  }

  /**
   * Get content generation analytics
   */
  async getContentAnalytics(dateRange: { start: Date; end: Date }): Promise<any> {
    const query = `
      SELECT 
        content_type,
        COUNT(*) as generation_count,
        AVG(JSON_EXTRACT(metadata, '$.content_length')) as avg_content_length,
        DATE(created_at) as generation_date
      FROM ai_content_logs
      WHERE created_at BETWEEN ? AND ?
      GROUP BY content_type, DATE(created_at)
      ORDER BY generation_date DESC, generation_count DESC
    `

    const [results] = await db.execute(query, [dateRange.start, dateRange.end])
    return results
  }

  /**
   * Batch generate content for multiple products
   */
  async batchGenerateProductDescriptions(products: any[]): Promise<{ product_id: number; description: string }[]> {
    const results = []

    for (const product of products) {
      try {
        const description = await this.generateProductDescription({
          name: product.name,
          category: product.category,
          potency: product.potency,
          indications: product.indications ? product.indications.split(",") : [],
          ingredients: product.ingredients ? product.ingredients.split(",") : [],
          target_audience: product.target_audience,
          tone: "professional",
        })

        results.push({
          product_id: product.id,
          description: description,
        })

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`Failed to generate description for product ${product.id}:`, error)
        results.push({
          product_id: product.id,
          description: `Error generating description: ${error.message}`,
        })
      }
    }

    return results
  }
}

// Export singleton instance
export const aiContentGenerator = new AIContentGenerator()
