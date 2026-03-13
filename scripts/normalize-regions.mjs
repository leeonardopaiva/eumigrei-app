import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const REGION_OPTIONS = [
  {
    key: 'atlanta-ga',
    label: 'Atlanta, GA',
    city: 'Atlanta',
    state: 'GA',
    aliases: [],
  },
  {
    key: 'boston-ma',
    label: 'Boston, MA',
    city: 'Boston',
    state: 'MA',
    aliases: ['greater boston', 'boston metro'],
  },
  {
    key: 'buffalo-ny',
    label: 'Buffalo, NY',
    city: 'Buffalo',
    state: 'NY',
    aliases: ['greater buffalo'],
  },
  {
    key: 'cambridge-ma',
    label: 'Cambridge, MA',
    city: 'Cambridge',
    state: 'MA',
    aliases: [],
  },
  {
    key: 'danbury-ct',
    label: 'Danbury, CT',
    city: 'Danbury',
    state: 'CT',
    aliases: [],
  },
  {
    key: 'dallas-tx',
    label: 'Dallas, TX',
    city: 'Dallas',
    state: 'TX',
    aliases: ['dfw', 'dallas fort worth'],
  },
  {
    key: 'fort-lauderdale-fl',
    label: 'Fort Lauderdale, FL',
    city: 'Fort Lauderdale',
    state: 'FL',
    aliases: [],
  },
  {
    key: 'framingham-ma',
    label: 'Framingham, MA',
    city: 'Framingham',
    state: 'MA',
    aliases: [],
  },
  {
    key: 'houston-tx',
    label: 'Houston, TX',
    city: 'Houston',
    state: 'TX',
    aliases: [],
  },
  {
    key: 'elizabeth-nj',
    label: 'Elizabeth, NJ',
    city: 'Elizabeth',
    state: 'NJ',
    aliases: [],
  },
  {
    key: 'los-angeles-ca',
    label: 'Los Angeles, CA',
    city: 'Los Angeles',
    state: 'CA',
    aliases: ['la', 'greater los angeles'],
  },
  {
    key: 'lowell-ma',
    label: 'Lowell, MA',
    city: 'Lowell',
    state: 'MA',
    aliases: [],
  },
  {
    key: 'miami-fl',
    label: 'Miami, FL',
    city: 'Miami',
    state: 'FL',
    aliases: ['greater miami'],
  },
  {
    key: 'newark-nj',
    label: 'Newark, NJ',
    city: 'Newark',
    state: 'NJ',
    aliases: [],
  },
  {
    key: 'new-york-city-ny',
    label: 'New York City, NY',
    city: 'New York City',
    state: 'NY',
    aliases: ['new york', 'new york ny', 'nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island'],
  },
  {
    key: 'orlando-fl',
    label: 'Orlando, FL',
    city: 'Orlando',
    state: 'FL',
    aliases: [],
  },
  {
    key: 'philadelphia-pa',
    label: 'Philadelphia, PA',
    city: 'Philadelphia',
    state: 'PA',
    aliases: ['philly'],
  },
  {
    key: 'providence-ri',
    label: 'Providence, RI',
    city: 'Providence',
    state: 'RI',
    aliases: [],
  },
  {
    key: 'san-diego-ca',
    label: 'San Diego, CA',
    city: 'San Diego',
    state: 'CA',
    aliases: [],
  },
  {
    key: 'san-francisco-bay-area-ca',
    label: 'San Francisco Bay Area, CA',
    city: 'San Francisco Bay Area',
    state: 'CA',
    aliases: ['san francisco', 'bay area', 'sf bay area', 'sf'],
  },
  {
    key: 'tampa-fl',
    label: 'Tampa, FL',
    city: 'Tampa',
    state: 'FL',
    aliases: [],
  },
  {
    key: 'washington-dc',
    label: 'Washington, DC',
    city: 'Washington',
    state: 'DC',
    aliases: ['washington dc', 'dc'],
  },
  {
    key: 'worcester-ma',
    label: 'Worcester, MA',
    city: 'Worcester',
    state: 'MA',
    aliases: [],
  },
];

const REGION_ALIAS_MAP = new Map([
  ['nyc', 'new-york-city-ny'],
  ['new-york-ny', 'new-york-city-ny'],
  ['new-york-city-ny', 'new-york-city-ny'],
  ['new-york-city', 'new-york-city-ny'],
  ['new york, ny', 'new-york-city-ny'],
  ['new york city, ny', 'new-york-city-ny'],
  ['boston-02108', 'boston-ma'],
  ['buffalo-nyc', 'buffalo-ny'],
  ['sf-bay-area-ca', 'san-francisco-bay-area-ca'],
  ['san-francisco-ca', 'san-francisco-bay-area-ca'],
]);

let regionByKey = new Map();
let regionMatchers = [];

function parseCommandLineFlags() {
  const args = new Set(process.argv.slice(2));
  return {
    dryRun: args.has('--dry-run'),
  };
}

function loadEnvFile(filename) {
  const fullPath = path.join(projectRoot, filename);

  if (!fs.existsSync(fullPath)) {
    return;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function rebuildRegionLookup(regionOptions) {
  regionByKey = new Map(regionOptions.map((region) => [region.key, region]));
  regionMatchers = regionOptions.map((region) => ({
    region,
    matchers: Array.from(
      new Set(
        [
          region.key,
          region.label,
          region.city,
          `${region.city}, ${region.state}`,
          `${region.city} ${region.state}`,
          ...(region.aliases || []),
        ]
          .map((value) => normalizeText(value))
          .filter((value) => value.length >= 3),
      ),
    ),
  }));
}

function getRegionByKey(regionKey) {
  return regionKey ? regionByKey.get(regionKey) ?? null : null;
}

function getRegionByLabel(label) {
  if (!label) {
    return null;
  }

  const normalizedLabel = label.trim().toLowerCase();
  const aliasMatch = REGION_ALIAS_MAP.get(normalizedLabel) ?? REGION_ALIAS_MAP.get(normalizeText(label));

  if (aliasMatch) {
    return getRegionByKey(aliasMatch);
  }

  return Array.from(regionByKey.values()).find((region) => region.label.toLowerCase() === normalizedLabel) ?? null;
}

async function loadRegionCatalog(prisma) {
  const dbRegions = await prisma.region.findMany({
    select: {
      key: true,
      label: true,
      city: true,
      state: true,
      aliases: true,
    },
  });

  return dbRegions.length > 0 ? dbRegions : REGION_OPTIONS;
}

function resolveRegionFromInputs(inputs, fallbackRegionKey) {
  const fallbackRegion = getRegionByKey(fallbackRegionKey);
  const candidates = inputs.filter(Boolean);

  for (const input of candidates) {
    const exactKeyMatch = getRegionByKey(input);

    if (exactKeyMatch) {
      return exactKeyMatch;
    }

    const exactLabelMatch = getRegionByLabel(input);

    if (exactLabelMatch) {
      return exactLabelMatch;
    }

    const normalizedInput = normalizeText(input);

    if (!normalizedInput) {
      continue;
    }

    const aliasMatch = REGION_ALIAS_MAP.get(normalizedInput);

    if (aliasMatch) {
      return getRegionByKey(aliasMatch);
    }

    let bestMatch = null;

    for (const matcherEntry of regionMatchers) {
      for (const matcher of matcherEntry.matchers) {
        if (!normalizedInput.includes(matcher)) {
          continue;
        }

        const score = normalizedInput === matcher ? 1000 + matcher.length : matcher.length;

        if (!bestMatch || score > bestMatch.score) {
          bestMatch = {
            region: matcherEntry.region,
            score,
          };
        }
      }
    }

    if (bestMatch) {
      return bestMatch.region;
    }
  }

  return fallbackRegion ?? null;
}

function logUpdate(kind, recordId, beforeRegionKey, afterRegionKey, beforeLabel, afterLabel) {
  console.log(
    `${kind} ${recordId}: ${beforeRegionKey || 'null'} -> ${afterRegionKey} | ${beforeLabel || 'null'} -> ${afterLabel}`,
  );
}

async function normalizeUsers(prisma, dryRun) {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      locationLabel: true,
      regionKey: true,
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const user of users) {
    const region = resolveRegionFromInputs([user.regionKey, user.locationLabel, user.email], user.regionKey);

    if (!region) {
      skipped += 1;
      continue;
    }

    if (user.regionKey === region.key && user.locationLabel === region.label) {
      continue;
    }

    logUpdate('user', user.id, user.regionKey, region.key, user.locationLabel, region.label);

    if (!dryRun) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          regionKey: region.key,
          locationLabel: region.label,
        },
      });
    }

    updated += 1;
  }

  return { updated, skipped };
}

async function normalizeBusinesses(prisma, dryRun) {
  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      name: true,
      locationLabel: true,
      regionKey: true,
      address: true,
      createdBy: {
        select: {
          regionKey: true,
          locationLabel: true,
        },
      },
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const business of businesses) {
    const region = resolveRegionFromInputs(
      [
        business.regionKey,
        business.locationLabel,
        business.address,
        business.createdBy?.regionKey,
        business.createdBy?.locationLabel,
      ],
      business.createdBy?.regionKey ?? business.regionKey,
    );

    if (!region) {
      skipped += 1;
      continue;
    }

    if (business.regionKey === region.key && business.locationLabel === region.label) {
      continue;
    }

    logUpdate(
      'business',
      `${business.id} (${business.name})`,
      business.regionKey,
      region.key,
      business.locationLabel,
      region.label,
    );

    if (!dryRun) {
      await prisma.business.update({
        where: { id: business.id },
        data: {
          regionKey: region.key,
          locationLabel: region.label,
        },
      });
    }

    updated += 1;
  }

  return { updated, skipped };
}

async function normalizeEvents(prisma, dryRun) {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      locationLabel: true,
      regionKey: true,
      venueName: true,
      createdBy: {
        select: {
          regionKey: true,
          locationLabel: true,
        },
      },
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const event of events) {
    const region = resolveRegionFromInputs(
      [
        event.regionKey,
        event.locationLabel,
        event.venueName,
        event.createdBy?.regionKey,
        event.createdBy?.locationLabel,
      ],
      event.createdBy?.regionKey ?? event.regionKey,
    );

    if (!region) {
      skipped += 1;
      continue;
    }

    if (event.regionKey === region.key && event.locationLabel === region.label) {
      continue;
    }

    logUpdate(
      'event',
      `${event.id} (${event.title})`,
      event.regionKey,
      region.key,
      event.locationLabel,
      region.label,
    );

    if (!dryRun) {
      await prisma.event.update({
        where: { id: event.id },
        data: {
          regionKey: region.key,
          locationLabel: region.label,
        },
      });
    }

    updated += 1;
  }

  return { updated, skipped };
}

async function normalizeCommunityPosts(prisma, dryRun) {
  const posts = await prisma.communityPost.findMany({
    select: {
      id: true,
      locationLabel: true,
      regionKey: true,
      author: {
        select: {
          regionKey: true,
          locationLabel: true,
        },
      },
    },
  });

  let updated = 0;
  let skipped = 0;

  for (const post of posts) {
    const region = resolveRegionFromInputs(
      [
        post.regionKey,
        post.locationLabel,
        post.author?.regionKey,
        post.author?.locationLabel,
      ],
      post.author?.regionKey ?? post.regionKey,
    );

    if (!region) {
      skipped += 1;
      continue;
    }

    if (post.regionKey === region.key && post.locationLabel === region.label) {
      continue;
    }

    logUpdate('post', post.id, post.regionKey, region.key, post.locationLabel, region.label);

    if (!dryRun) {
      await prisma.communityPost.update({
        where: { id: post.id },
        data: {
          regionKey: region.key,
          locationLabel: region.label,
        },
      });
    }

    updated += 1;
  }

  return { updated, skipped };
}

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL nao encontrado. Configure .env.local ou exporte a variavel.');
  }

  const { dryRun } = parseCommandLineFlags();
  const prisma = new PrismaClient();

  try {
    console.log(dryRun ? 'Executando normalize-regions em dry-run' : 'Executando normalize-regions');
    rebuildRegionLookup(await loadRegionCatalog(prisma));

    const userResult = await normalizeUsers(prisma, dryRun);
    const businessResult = await normalizeBusinesses(prisma, dryRun);
    const eventResult = await normalizeEvents(prisma, dryRun);
    const postResult = await normalizeCommunityPosts(prisma, dryRun);

    console.log('\nResumo:');
    console.log(`users: updated=${userResult.updated}, skipped=${userResult.skipped}`);
    console.log(`businesses: updated=${businessResult.updated}, skipped=${businessResult.skipped}`);
    console.log(`events: updated=${eventResult.updated}, skipped=${eventResult.skipped}`);
    console.log(`posts: updated=${postResult.updated}, skipped=${postResult.skipped}`);

    if (dryRun) {
      console.log('\nDry-run finalizado. Nenhuma alteracao foi persistida.');
    } else {
      console.log('\nNormalizacao concluida.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

rebuildRegionLookup(REGION_OPTIONS);

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
