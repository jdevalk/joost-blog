import HeroBanner from "../../../../src/components/blocks/HeroBanner.astro";
import CtaBanner from "../../../../src/components/blocks/CtaBanner.astro";
import FeaturedVideos from "../../../../src/components/blocks/FeaturedVideos.astro";
import SocialLinksBlock from "../../../../src/components/blocks/SocialLinksBlock.astro";
import Label from "../../../../src/components/blocks/Label.astro";

export const blockComponents = {
	heroBanner: HeroBanner,
	ctaBanner: CtaBanner,
	featuredVideos: FeaturedVideos,
	socialLinks: SocialLinksBlock,
	label: Label,
};
