import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useCategory from "../hooks/useCategory";
import Layout from "../components/Layout";
const Categories = () => {
  const categories = useCategory();
  return (
    <Layout title={"All Categories"}>
      <div className="container">
        {categories?.length > 0 ? (
          <div className="row">
            {categories.map((c) => (
              <div className="col-md-6 mt-5 mb-3 gx-3 gy-3" key={c._id}>
                <Link
                  to={`/category/${c.slug}`}
                  className="btn btn-primary"
                  data-testid="category-link"
                >
                  {c.name}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div>No categories found</div>
        )}
      </div>
    </Layout>
  );
};

export default Categories;
