import type { Metadata } from 'next';
import { createServerSideClient } from '@/lib/supabase/client';
import MobileLayout from '@/components/MobileLayout';

interface TemplatePageProps {
  params: Promise<{ 'template-id': string }>;
}

export async function generateMetadata(
  { params }: TemplatePageProps
): Promise<Metadata> {
  const { 'template-id': templateId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    const supabase = createServerSideClient();
    const { data: template } = await supabase
      .from('pool_templates')
      .select(`
        id,
        title,
        subtitle,
        description,
        cover_image,
        icon,
        launch_count,
        participant_count,
        difficulty_score,
        is_featured,
        is_official,
        analytics:pool_template_analytics(viral_coefficient),
        category:pool_template_categories(name, icon)
      `)
      .eq('id', templateId)
      .single();

    if (!template) {
      return {
        title: 'PoolParty — Pool Template',
        description: 'Discover and use pool templates on PoolParty.',
      };
    }

    const launchText = template.launch_count === 1 ? 'launch' : 'launches';
    const playerText = template.participant_count === 1 ? 'player' : 'players';
    const ogTitle = `${template.title} — PoolParty Template`;
    const ogDescription = `${template.subtitle || template.description || 'A popular pool template'} • ${template.launch_count} ${launchText} • ${template.participant_count} ${playerText}`;

    return {
      title: ogTitle,
      description: ogDescription,
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        type: 'website',
        url: `${baseUrl}/template/${templateId}`,
        images: [
          {
            url: template.cover_image || `${baseUrl}/api/og?type=template&id=${templateId}&title=${encodeURIComponent(template.title)}&icon=${template.icon}&launches=${template.launch_count}`,
            width: 1200,
            height: 630,
            alt: `${template.title} template preview`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [template.cover_image || `${baseUrl}/api/og?type=template&id=${templateId}&title=${encodeURIComponent(template.title)}&icon=${template.icon}&launches=${template.launch_count}`],
      },
    };
  } catch (error) {
    return {
      title: 'PoolParty — Pool Template',
      description: 'Discover and use pool templates on PoolParty.',
    };
  }
}

export default function TemplatePage() {
  return (
    <MobileLayout>
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Template Preview</h1>
          <p className="text-sm text-muted-foreground">Loading template...</p>
        </div>
      </div>
    </MobileLayout>
  );
}