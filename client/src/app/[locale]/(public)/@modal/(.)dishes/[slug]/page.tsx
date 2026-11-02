import dishApiRequest from "@/apiRequests/dish";
import Modal from "@/app/[locale]/(public)/@modal/(.)dishes/[slug]/Modal";
import DishDetail from "@/app/[locale]/(public)/dishes/[slug]/DishDetail";
import { getIdFromSlugUrl, wrapServerApi } from "@/lib/utils";

// Force dynamic rendering for modal intercept routes to avoid build-time issues
export const dynamic = "force-dynamic";

export default async function DishPage({
  params,
}: {
  params: Promise<{
    slug: string;
  }>;
}) {
  const slug = (await params).slug;
  const id = getIdFromSlugUrl(slug);
  const data = await wrapServerApi(() => dishApiRequest.getDish(Number(id)));
  const dish = data?.payload?.data;
  return (
    <Modal>
      <DishDetail dish={dish} />
    </Modal>
  );
}
