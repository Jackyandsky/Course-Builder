export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          author: string | null
          category_id: string | null
          content_type: Database["public"]["Enums"]["content_type"] | null
          cover_image_url: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          discount_percentage: number | null
          file_url: string | null
          homepage_order: number | null
          id: string
          is_free: boolean | null
          is_public: boolean | null
          isbn: string | null
          language: string | null
          menu_order: number | null
          metadata: Json | null
          price: number | null
          public_slug: string | null
          publication_year: number | null
          publisher: string | null
          sale_price: number | null
          show_on_homepage: boolean | null
          show_on_menu: boolean | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          tags: string[] | null
          title: string
          total_pages: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          file_url?: string | null
          homepage_order?: number | null
          id?: string
          is_free?: boolean | null
          is_public?: boolean | null
          isbn?: string | null
          language?: string | null
          menu_order?: number | null
          metadata?: Json | null
          price?: number | null
          public_slug?: string | null
          publication_year?: number | null
          publisher?: string | null
          sale_price?: number | null
          show_on_homepage?: boolean | null
          show_on_menu?: boolean | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          title: string
          total_pages?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          category_id?: string | null
          content_type?: Database["public"]["Enums"]["content_type"] | null
          cover_image_url?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          discount_percentage?: number | null
          file_url?: string | null
          homepage_order?: number | null
          id?: string
          is_free?: boolean | null
          is_public?: boolean | null
          isbn?: string | null
          language?: string | null
          menu_order?: number | null
          metadata?: Json | null
          price?: number | null
          public_slug?: string | null
          publication_year?: number | null
          publisher?: string | null
          sale_price?: number | null
          show_on_homepage?: boolean | null
          show_on_menu?: boolean | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          title?: string
          total_pages?: number | null
          updated_at?: string | null
          user_id?: string
        }
      }
      content: {
        Row: {
          book_id: string | null
          category_id: string | null
          content: string | null
          content_data: Json | null
          created_at: string | null
          currency: string | null
          discount_percentage: number | null
          featured: boolean | null
          homepage_order: number | null
          id: string
          is_free: boolean | null
          is_public: boolean | null
          menu_order: number | null
          metadata: Json | null
          name: string
          parent_category_id: string | null
          price: number | null
          public_slug: string | null
          sale_price: number | null
          show_on_homepage: boolean | null
          show_on_menu: boolean | null
          sort_order: number | null
          status: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id?: string | null
          category_id?: string | null
          content?: string | null
          content_data?: Json | null
          created_at?: string | null
          currency?: string | null
          discount_percentage?: number | null
          featured?: boolean | null
          homepage_order?: number | null
          id?: string
          is_free?: boolean | null
          is_public?: boolean | null
          menu_order?: number | null
          metadata?: Json | null
          name: string
          parent_category_id?: string | null
          price?: number | null
          public_slug?: string | null
          sale_price?: number | null
          show_on_homepage?: boolean | null
          show_on_menu?: boolean | null
          sort_order?: number | null
          status?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          book_id?: string | null
          category_id?: string | null
          content?: string | null
          content_data?: Json | null
          created_at?: string | null
          currency?: string | null
          discount_percentage?: number | null
          featured?: boolean | null
          homepage_order?: number | null
          id?: string
          is_free?: boolean | null
          is_public?: boolean | null
          menu_order?: number | null
          metadata?: Json | null
          name?: string
          parent_category_id?: string | null
          price?: number | null
          public_slug?: string | null
          sale_price?: number | null
          show_on_homepage?: boolean | null
          show_on_menu?: boolean | null
          sort_order?: number | null
          status?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
      }
      courses: {
        Row: {
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          discount_percentage: number | null
          duration_hours: number | null
          homepage_order: number | null
          id: string
          is_free: boolean | null
          is_public: boolean | null
          menu_order: number | null
          metadata: Json | null
          objectives: string[] | null
          prerequisites: string[] | null
          price: number | null
          public_slug: string | null
          published_at: string | null
          sale_price: number | null
          short_description: string | null
          show_on_homepage: boolean | null
          show_on_menu: boolean | null
          status: Database["public"]["Enums"]["course_status"] | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          discount_percentage?: number | null
          duration_hours?: number | null
          homepage_order?: number | null
          id?: string
          is_free?: boolean | null
          is_public?: boolean | null
          menu_order?: number | null
          metadata?: Json | null
          objectives?: string[] | null
          prerequisites?: string[] | null
          price?: number | null
          public_slug?: string | null
          published_at?: string | null
          sale_price?: number | null
          short_description?: string | null
          show_on_homepage?: boolean | null
          show_on_menu?: boolean | null
          status?: Database["public"]["Enums"]["course_status"] | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          discount_percentage?: number | null
          duration_hours?: number | null
          homepage_order?: number | null
          id?: string
          is_free?: boolean | null
          is_public?: boolean | null
          menu_order?: number | null
          metadata?: Json | null
          objectives?: string[] | null
          prerequisites?: string[] | null
          price?: number | null
          public_slug?: string | null
          published_at?: string | null
          sale_price?: number | null
          short_description?: string | null
          show_on_homepage?: boolean | null
          show_on_menu?: boolean | null
          status?: Database["public"]["Enums"]["course_status"] | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
      }
    }
    Enums: {
      content_type: "text" | "video" | "audio" | "pdf" | "image" | "interactive"
      course_status: "draft" | "published" | "archived"
      difficulty_level: "basic" | "standard" | "premium"
    }
  }
}