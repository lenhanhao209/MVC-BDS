const mongoose = require("mongoose");
const fileHelper = require("../util/file");
const { validationResult } = require("express-validator/check");
const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
  res.render("user/edit-product", {
    pageTitle: "Add Product",
    path: "/user/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
  });
};

exports.postAddProduct = (req, res, next) => {
  const name = req.body.name;
  const acreage = req.body.acreage;
  const address = req.body.address;
  const images = req.files;
  const price = req.body.price;
  const description = req.body.description;
  if (!images) {
    return res.status(422).render("user/edit-product", {
      pageTitle: "User Product",
      path: "/user/add-product",
      editing: false,
      hasError: true,
      product: {
        price: price,
        name: name,
        acreage: acreage,
        address: address,
        description: description,
      },
      errorMessage: "Attached file is not an image.",
      validationErrors: [],
    });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("user/edit-product", {
      pageTitle: "User Product",
      path: "/user/add-product",
      editing: false,
      hasError: true,
      product: {
        price: price,
        name: name,
        acreage: acreage,
        address: address,
        description: description,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  const imageUrl = images.map((image) => image.path);
  const product = new Product({
    price: price,
    name: name,
    acreage: acreage,
    address: address,
    description: description,
    imageUrl: imageUrl,
    userId: req.user,
    published: false,
    role: "user",
  });
  product
    .save()
    .then((result) => {
      console.log("Created Product");
      res.redirect("/user/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("user/edit-product", {
        pageTitle: "Edit Product",
        path: "/user/edit-product",
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedName = req.body.name;
  const updatedPrice = req.body.price;
  const updatedAcreage = req.body.acreage;
  const updatedAddress = req.body.address;
  const updatedDesc = req.body.description;
  const image = req.files;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("user/edit-product", {
      pageTitle: "Edit Product",
      path: "/user/edit-product",
      editing: true,
      hasError: true,
      product: {
        name: updatedName,
        price: updatedPrice,
        acreage: updatedAcreage,
        address: updatedAddress,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  Product.findById(prodId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect("/");
      }
      product.name = updatedName;
      product.price = updatedPrice;
      product.acreage = updatedAcreage;
      product.address = updatedAddress;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (image) {
        for (let i = 0; i < product.imageUrl.length; i++) {
          fileHelper.deleteFile(product.imageUrl[i]);
        }
        const images = req.files;
        const imageUrl = images.map((image) => image.path);
        product.imageUrl = imageUrl;
      }
      return product.save().then((result) => {
        console.log("UPDATED PRODUCT!");
        res.redirect("/user/products");
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("user/products", {
        prods: products,
        pageTitle: "User Products",
        path: "/user/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const recentProduct = localStorage.getItem("product")
    ? JSON.parse(localStorage.getItem("product"))
    : [];
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error("Product not found."));
      }
      recentProduct.splice(
        recentProduct.findIndex((product) => product._id === prodId),
        1
      );
      localStorage.setItem("product", JSON.stringify(recentProduct));
      fileHelper.deleteFile(product.imageUrl[0]);
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log("DESTROYED PRODUCT`");
      res.status(200).json({ message: "Success!" });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ message: "Deleting product failed." });
    });
};
