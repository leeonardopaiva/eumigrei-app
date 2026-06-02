export interface RegionalGroupMemberPreview {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
  locationLabel: string | null;
}

export interface RegionalGroupCard {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  category: string | null;
  regionLabel: string | null;
  memberCount: number;
  createdAt: string;
  publicPath: string;
  memberPreviews: RegionalGroupMemberPreview[];
}
