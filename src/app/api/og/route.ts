import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'pool';
  const title = decodeURIComponent(searchParams.get('title') || 'PoolParty');
  const icon = searchParams.get('icon') || '🏆';
  const players = searchParams.get('players') || '0';
  const launches = searchParams.get('launches') || '0';
  const group = decodeURIComponent(searchParams.get('group') || 'Group');
  const emoji = searchParams.get('emoji') || '🏆';
  const members = searchParams.get('members') || '0';

  try {
    if (type === 'pool') {
      return new ImageResponse(
        {
          type: 'div',
          props: {
            style: {
              fontSize: 48,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: 'system-ui',
              padding: '40px',
              textAlign: 'center',
            },
            children: [
              { type: 'div', props: { style: { fontSize: 80, marginBottom: 20 }, children: '🏊' } },
              {
                type: 'div',
                props: {
                  style: { fontSize: 56, fontWeight: 'bold', marginBottom: 20, maxWidth: '90%' },
                  children: title,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 28, color: '#7C5CFF', marginBottom: 30 },
                  children: `Join ${players} players in this prediction pool`,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 20, color: '#B8B4C8' },
                  children: 'PoolParty — Private Group Prediction Contracts',
                },
              },
            ],
          },
        },
        { width: 1200, height: 630 }
      );
    } else if (type === 'template') {
      return new ImageResponse(
        {
          type: 'div',
          props: {
            style: {
              fontSize: 48,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: 'system-ui',
              padding: '40px',
              textAlign: 'center',
            },
            children: [
              { type: 'div', props: { style: { fontSize: 80, marginBottom: 20 }, children: icon } },
              {
                type: 'div',
                props: {
                  style: { fontSize: 56, fontWeight: 'bold', marginBottom: 20, maxWidth: '90%' },
                  children: title,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 28, color: '#7C5CFF', marginBottom: 30 },
                  children: `${launches} launches • ${players} players`,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 20, color: '#B8B4C8' },
                  children: 'PoolParty Template — Start Your Pool',
                },
              },
            ],
          },
        },
        { width: 1200, height: 630 }
      );
    } else if (type === 'invite') {
      return new ImageResponse(
        {
          type: 'div',
          props: {
            style: {
              fontSize: 48,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: 'system-ui',
              padding: '40px',
              textAlign: 'center',
            },
            children: [
              {
                type: 'div',
                props: { style: { fontSize: 80, marginBottom: 20 }, children: emoji },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 56, fontWeight: 'bold', marginBottom: 20, maxWidth: '90%' },
                  children: `Join ${group}`,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 28, color: '#7C5CFF', marginBottom: 30 },
                  children: `${members} members • Prediction pools`,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 20, color: '#B8B4C8' },
                  children: 'PoolParty — Join the Group',
                },
              },
            ],
          },
        },
        { width: 1200, height: 630 }
      );
    }

    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            fontSize: 48,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontFamily: 'system-ui',
          },
          children: [
            { type: 'div', props: { style: { fontSize: 80, marginBottom: 20 }, children: '🏊' } },
            {
              type: 'div',
              props: { style: { fontSize: 56, fontWeight: 'bold' }, children: 'PoolParty' },
            },
            {
              type: 'div',
              props: {
                style: { fontSize: 28, color: '#7C5CFF', marginTop: 20 },
                children: 'Private Group Prediction Contracts',
              },
            },
          ],
        },
      },
      { width: 1200, height: 630 }
    );
  } catch (error) {
    return new Response('Failed to generate OG image', { status: 500 });
  }
}
