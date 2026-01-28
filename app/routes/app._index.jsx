import { useEffect } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { Edit3 } from "lucide-react";

/* -------------------- LOADER (FETCH PRODUCTS) -------------------- */
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query {
      products(first: 50) {
        edges {
          node {
            id
            title
            status
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `);

  const data = await response.json();

  return {
    products: data.data.products.edges.map(e => e.node),
  };
};

/* -------------------- ACTION (CREATE PRODUCT) -------------------- */
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];

  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            status
            variants(first: 1) {
              edges {
                node {
                  id
                  price
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    }
  );

  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;

  return { product };
};

/* -------------------- PAGE -------------------- */
export default function Index() {
  const { products } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const isCreating =
    fetcher.state === "submitting" && fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.product?.id) {
      shopify.toast.show("Product created");
    }
  }, [fetcher.data?.product?.id, shopify]);

  const generateProduct = () =>
    fetcher.submit({}, { method: "POST" });

  return (
    <s-page heading="Shopify app template">
      <s-button
        slot="primary-action"
        onClick={generateProduct}
        {...(isCreating ? { loading: true } : {})}
      >
        Generate a product
      </s-button>


<s-section heading="Products">
  {products.length === 0 ? (
    <s-paragraph>No products found</s-paragraph>
  ) : (
    <s-stack direction="block" gap="base">
      {products.map((product) => {
        const price =
          product.variants?.edges?.[0]?.node?.price ?? "N/A";

        return (
          <s-box
            key={product.id}
            padding="base"
            borderWidth="base"
            borderRadius="base"
            position="relative"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              minHeight: "120px",
            }}
          >
            {/* Edit icon top-right */}
            <s-button
              variant="tertiary"
              onClick={() =>
                shopify.intents.invoke?.("edit:shopify/Product", {
                  value: product.id,
                })
              }
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                width: "36px",
                height: "36px",
                padding: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Edit3 size={18} />
            </s-button>

            {/* Product info */}
            <div style={{ paddingRight: "50px" }}>
              <s-heading size="small">{product.title}</s-heading>
              <s-text>Status: {product.status}</s-text>
              <s-text>Price: {price}</s-text>
            </div>
          </s-box>
        );
      })}
    </s-stack>
  )}
</s-section>

    </s-page>
  );
}

/* -------------------- HEADERS -------------------- */
export const headers = headersArgs => {
  return boundary.headers(headersArgs);
};
