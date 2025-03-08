import * as controllers from './productController'
import productModel from "../models/productModel"
import categoryModel from '../models/categoryModel'
import * as fs from 'fs'

jest.mock('dotenv')
jest.mock('braintree')
jest.mock('mongoose')
jest.mock('fs')
// jest.mock('../../models/productModel', () => (function () {
//   this.findOne = jest.fn(() => this);
//   this.select = jest.fn(() => this);
//   this.populate = jest.fn(() => this);
// }))
jest.mock("../models/productModel", () => {
  const def = jest.fn();
  def.find = jest.fn(() => def);
  def.findById = jest.fn(() => def);
  def.findByIdAndDelete = jest.fn(() => def);
  def.findByIdAndUpdate = jest.fn(() => def);
  def.findOne = jest.fn(() => def);
  def.select = jest.fn(() => def);
  def.limit = jest.fn(() => def);
  def.populate = jest.fn(() => def);
  def.sort = jest.fn(() => def);
  def.estimatedDocumentCount = jest.fn(() => def);
  def.skip = jest.fn(() => def);
  def.then = jest.fn((res, _) => {
    res('ok')
  });

  /**
   * The model behaves as a thenable that resolves with val.
   * 
   * @param {any} val 
   */
  def.mockResolvesToOnce = (val) => {
    def.then.mockImplementationOnce((res, rej) => {
      res(val)
    })
  }

  /**
   * The model behaves as a thenable that rejects with val.
   * 
   * @param {any} val 
   */
  def.mockRejectsWithOnce = (val) => {
    def.then.mockImplementationOnce((res, rej) => {
      rej(val)
    })
  }

  return { 
    __esModule: true,
    default: def,
  };
})

jest.mock("../models/categoryModel", () => {
  const def = jest.fn();
  def.findOne = jest.fn(() => def);
  def.then = jest.fn((res, _) => {
    res('ok')
  });

  /**
   * The model behaves as a thenable that resolves with val.
   * 
   * @param {any} val 
   */
  def.mockResolvesToOnce = (val) => {
    def.then.mockImplementationOnce((res, rej) => {
      res(val)
    })
  }

  /**
   * The model behaves as a thenable that rejects with val.
   * 
   * @param {any} val 
   */
  def.mockRejectsWithOnce = (val) => {
    def.then.mockImplementationOnce((res, rej) => {
      rej(val)
    })
  }

  return { 
    __esModule: true,
    default: def,
  };
})


const res = {
  status: jest.fn(() => res),
  send: jest.fn(),
  json: jest.fn(),
  set: jest.fn(),
}


const SAMPLE_PRODUCTS = [
  {
    photo: {
      data: 'photo data',
      contentType: "image/jpeg"
    },
    _id: "66db427fdb0119d9234b27f3",
    name: "Laptop",
    slug: "laptop",
    description: "A powerful laptop",
    price: 1499.99,
    category: "66db427fdb0119d9234b27ed",
    quantity: 30,
    shipping: true,
  },
  {
    photo: {
      data: 'photo data',
      contentType: "image/jpeg"
    },
    _id: "66db427fdb0119d9234b27f5",
    name: "Smartphone",
    slug: "smartphone",
    description: "A high-end smartphone",
    price: 999.99,
    category: "66db427fdb0119d9234b27ed",
    quantity: 50,
    shipping: false,
  }
]

beforeEach(() => {
  jest.clearAllMocks();
})

describe('Given getSingleProductController', () => {

  it('When receiving a request for a product', async () => {
    const req = {
      params: {
        slug: 'slug'
      }
    }
    const product = { _id: 'id' };
    productModel.populate.mockResolvedValueOnce(product);

    await controllers.getSingleProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Single Product Fetched",
      product
    });

    expect(productModel.findOne).toHaveBeenCalledWith({slug: 'slug'})
    expect(productModel.select).toHaveBeenCalledWith('-photo')
    expect(productModel.populate).toHaveBeenCalledWith('category')
  })

  it('When an error is thrown while getting a product', async () => {
    const req = {
      params: {
        slug: 'slug'
      }
    }

    const err = { message: 'populate error' }
    productModel.populate.mockRejectedValueOnce(err);

    await controllers.getSingleProductController(req, res);


    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Eror while getitng single product",
      error: err,
    });
    
  })

})

describe('Given createProductController', () => {
  
  function createDefaultRequest() {
    const details = {
      name: 'product name',
      description: 'product description',
      price: 'product price',
      category: 'product category',
      quantity: 'product quantity',
      shipping: 'product shipping',
    }
    const photo = {
      path: 'photo path',
      size: 300,
      type: 'photo type',
    }

    return {
      fields: details,
      files: { photo },
    };
  }


  it('When sent a request to create a product', async () => {
    const req = createDefaultRequest()
    
    const returnedDocument = {
      ...req.fields,
      photo: req.files.photo,
      save: jest.fn(),
    }

    productModel.mockReturnValueOnce(returnedDocument);
    fs.readFileSync.mockReturnValueOnce('photo data')

    await controllers.createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Created Successfully",
      products: returnedDocument,
    });

  })

  test.each(['fields.name', 'fields.description', 'fields.price', 'fields.category', 'fields.quantity', 
    'files.shipping'])
    ('When sent a request missing %s', async (prop) => {
    const req = createDefaultRequest();
    const props = prop.split('.');

    // Delete the property
    {
      let target = req;
      for (let i = 0; i < props.length - 1; i++) {
        target = target[props[i]];
      }
      delete target[props[props.length - 1]];
    }

    await controllers.createProductController(req, res);
    console.log(res.send.mock.calls)

    expect(res.status).toHaveBeenCalledWith(500);

  });

  test('When sent without photo', async () => {
    const req = createDefaultRequest();
    delete req.files.photo;

    
    const returnedDocument = {
      ...req.fields,
      save: jest.fn(),
    }

    productModel.mockReturnValueOnce(returnedDocument);

    await controllers.createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('When sent a photo with size > 1 MB', async () => {

    const req = createDefaultRequest();
    req.files.photo.size = 1000001;

    await controllers.createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ 
      error: "photo is Required and should be less then 1mb" 
    });
    expect(productModel).not.toHaveBeenCalled();

  })

  it('When the document fails to save', async () => {

    const req = createDefaultRequest();
    
    const document = {
      ...req.fields,
      photo: req.files.photo,
      save: jest.fn().mockRejectedValueOnce({message: 'error thrown by save()'}),
    }
    productModel.mockReturnValueOnce(document);
    fs.readFileSync.mockReturnValueOnce('photo data')

    await controllers.createProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({ 
      error: { message: "error thrown by save()" },
      message: "Error in crearing product",
      success: false,
    });
  })
})

describe('Given getProductController', () => {

  it('When sent a request to get products', async () => {
    productModel.then.mockImplementationOnce(res => {
      res([]);
    });

    await controllers.getProductController({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      counTotal: 0,
      message: "ALlProducts ",
      products: [],
    });

  })
  
  it('When sent a request, but an error occurs when retriving products', async () => {
    productModel.then.mockImplementationOnce((_, rej) => {
      rej({message: 'error retrieving product'});
    });

    await controllers.getProductController({}, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Erorr in getting products",
      error: 'error retrieving product',
    });

  })
})

describe('Given productPhotoController', () => {
  const req = {
    params: {
      pid: 'product id'
    }
  };

  it('When sent a request for a photo', async () => {
    const document = {
      photo: {
        data: 'photo data',
        contentType: 'photo content type',
      }
    }
    productModel.then.mockImplementationOnce(res => {
      res(document);
    });

    await controllers.productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.set).toHaveBeenCalledWith("Content-type", document.photo.contentType);
    expect(res.send).toHaveBeenCalledWith(document.photo.data);
  })
  
  it('When sent a request for a photo, but an error occurs when retrieving it', async () => {
    const error = { message: 'error retrieving photo' };
    productModel.then.mockImplementationOnce((_, rej) => {
      rej(error);
    });

    await controllers.productPhotoController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Erorr while getting photo",
      error: error,
    });

  })
})


describe('Given deleteProductController', () => {
  const req = {
    params: {
      id: 'product id'
    }
  }

  it('When sent a request to delete a product', async () => {
    productModel.then.mockImplementationOnce(res => {
      res();
    });

    await controllers.deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Deleted successfully",
    });

    expect(productModel.findByIdAndDelete).toHaveBeenCalled();

  })
  
  it('When sent a request, but an error occurs when deleting products', async () => {
    const error = { message: 'error deleting product' }
    productModel.then.mockImplementationOnce((_, rej) => {
      rej(error);
    });

    await controllers.deleteProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error while deleting product",
      error,
    });

  })
})

describe('Given updateProductController', () => {
  function createDefaultRequest() {
    return {
      params: {
        pid: 'product id',
      },
      fields: {
        name: 'product name',
        description: 'product description',
        price: 'product price',
        category: 'product category',
        quantity: 'product quantity',
        shipping: 'product shipping',
      },
      files: { 
        photo: {
          path: 'photo path',
          size: 300,
          type: 'photo type',
        }
     },
    };
  }
  
  it('When sent a request to update a product', async () => {
    
    const req = createDefaultRequest();
    const expectedUpdatedDocument = {
      ...req.fields,
      photo: {
        ...req.files.photo,
        data: 'photo data',
      },
      save: jest.fn().mockResolvedValue('ok'),
    }
    
    productModel.then.mockImplementationOnce(res => {
      res(expectedUpdatedDocument);
    });
    fs.readFileSync.mockReturnValueOnce(expectedUpdatedDocument.photo.data)

    await controllers.updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Updated Successfully",
      products: expectedUpdatedDocument,
    });

  })

  it('When sent a request to update a without photo', async () => {
    
    const req = createDefaultRequest();
    delete req.files.photo;

    const expectedUpdatedDocument = {
      ...req.fields,
      save: jest.fn().mockResolvedValue('ok'),
    }
    
    productModel.then.mockImplementationOnce(res => {
      res(expectedUpdatedDocument);
    });

    await controllers.updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      message: "Product Updated Successfully",
      products: expectedUpdatedDocument,
    });
    expect(fs.readFileSync).not.toHaveBeenCalled()

  })

  it('When sent a request but updating values fail', async () => {
    
    const req = createDefaultRequest();
    const error = { message: 'error in then()' };
    
    productModel.then.mockImplementationOnce((_, rej) => {
      rej(error);
    });
    // fs.readFileSync.mockReturnValueOnce(expectedUpdatedDocument.photo.data)

    await controllers.updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error,
      message: "Error in Updte product",
    });

  })

  it('When sent a request but reading file fails', async () => {
    
    const req = createDefaultRequest();
    const error = { message: 'error in fs.readFileSync' };
    const expectedUpdatedDocument = {
      ...req.fields,
      photo: {
        ...req.files.photo,
        data: 'photo data',
      },
      save: jest.fn().mockResolvedValue('ok'),
    }

    productModel.then.mockImplementationOnce(res => {
      res(expectedUpdatedDocument);
    });
    fs.readFileSync.mockImplementationOnce(() => {
      throw error;
    })

    await controllers.updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error,
      message: "Error in Updte product",
    });

  })

  it('When sent a request but saving fails', async () => {
    
    const req = createDefaultRequest();
    const error = { message: 'error in save()' };
    const expectedUpdatedDocument = {
      ...req.fields,
      photo: {
        ...req.files.photo,
        data: 'photo data',
      },
      save: jest.fn().mockRejectedValue(error),
    }

    
    productModel.then.mockImplementationOnce(res => {
      res(expectedUpdatedDocument);
    });
    fs.readFileSync.mockReturnValueOnce(expectedUpdatedDocument.photo.data);

    await controllers.updateProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error,
      message: "Error in Updte product",
    });

  })

  it.each([
    {prop: 'name', message: "Name is Required"},
    {prop: 'description', message: "Description is Required"},
    {prop: 'price', message: "Price is Required"},
    {prop: 'category', message: "Category is Required"},
    {prop: 'quantity', message: "Quantity is Required"},
  ])('When sent a request missing a \'$prop\' parameter', async ({prop, message}) => {
    const req = createDefaultRequest();
    delete req.fields[prop];

    await controllers.updateProductController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: message,
    });
  });

  it('When sent a request with photo size > 1 MB', async () => {
    const req = createDefaultRequest();
    req.files.photo.size = 1000001;

    await controllers.updateProductController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      error: "photo is Required and should be less then 1mb",
    });
  });
})


describe('Given productFiltersController', () => {
  const req = {
    body: {
      checked: ['catid1', 'catid2'],
      radio: [0, 19],
    },
  }

  const products = SAMPLE_PRODUCTS
  
  it('When sent a request to filter a product', async () => {
    productModel.then.mockImplementationOnce((res, _) => {
      res(products)
    })

    await controllers.productFiltersController(req, res);

    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(productModel.find).toHaveBeenCalledWith({
      category: ['catid1', 'catid2'],
      price: {
        $gte: 0, $lte: 19
      },
    });
  });

  it('When sent a request bur retrieving products fail', async () => {
    const error = { message: 'error in then()' }

    productModel.then.mockImplementationOnce((_, rej) => {
      rej(error)
    })

    await controllers.productFiltersController(req, res);

    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error WHile Filtering Products",
      error,
    });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Given productCountController', () => {

  it('When sent a request for product count', async () => {
    productModel.then.mockImplementationOnce((res, _) => {
      res(10);
    });

    await controllers.productCountController({}, res);

    expect(res.send).toHaveBeenCalledWith({
      success: true,
      total: 10,
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('When sent a request for product count', async () => {
    const error = { message: 'error in then()' }
    productModel.then.mockImplementationOnce((_, rej) => {
      rej(error);
    });

    await controllers.productCountController({}, res);

    expect(res.send).toHaveBeenCalledWith({
      message: "Error in product count",
      success: false,
      error,
    });
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('Given productListController', () => {

  const products = SAMPLE_PRODUCTS.map(({photo, ...prod}) => prod);

  function createDefaultRequest() {
    return {
      params: {
        page: 1,
      },
    }
  }

  it('When sent a request for the 1st list of products', async () => {

    productModel.mockResolvesToOnce(products)

    await controllers.productListController(createDefaultRequest(), res);
    
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products,
    });
    expect(res.status).toHaveBeenCalledWith(200);

    expect(productModel.skip).toHaveBeenCalledWith(0);

  });

  it('When sent a request for the 2nd list of products', async () => {
    const req = createDefaultRequest();
    req.params.page = 2

    productModel.mockResolvesToOnce(products)

    await controllers.productListController(req, res);
    
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products,
    });
    expect(res.status).toHaveBeenCalledWith(200);

    expect(productModel.skip).toHaveBeenCalledWith(6);

  });

  it('When sent a request but there is an error retrieving product', async () => {
    const error = { error: 'error in then()' }

    productModel.mockRejectsWithOnce(error)

    await controllers.productListController(createDefaultRequest(), res);
    
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "error in per page ctrl",
      error,
    });
    expect(res.status).toHaveBeenCalledWith(400);

  });

  it.skip('When sent a request for an invalid number of ', async () => {
    const req = {
      params: {
        page: 'asdflol',
      },
    }

    await controllers.productListController(req, res);
    
    expect(res.status).toHaveBeenCalledWith(400);

  });
});

describe('Given searchProductController', () => {
  const products = SAMPLE_PRODUCTS.map(({photo, ...prod}) => prod);
  const req = {
    params: {
      keyword: 'keyword'
    }
  };

  it('When sent a request for searching product', async () => {
    productModel.mockResolvesToOnce(products);

    await controllers.searchProductController(req, res);

    expect(res.json).toHaveBeenCalledWith(products);

    expect(productModel.find).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: 'keyword', $options: "i" } },
        { description: { $regex: 'keyword', $options: "i" } },
      ],
    });
  });

  it('When encountering error while searching product', async () => {
    const error = { message: 'error in then()' }
    productModel.mockRejectsWithOnce(error);

    await controllers.searchProductController(req, res);

    
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "Error In Search Product API",
      error,
    });
    expect(res.status).toHaveBeenCalledWith(400);
  });

})

describe('Given relatedProductController', () => {
  const category = {
    _id: "66db427fdb0119d9234b27ef",
    name: "Book",
    slug: "book",
  }
  const products = SAMPLE_PRODUCTS.map(({photo, category: _, ...prod}) => ({...prod, category}));
  
  const req = {
    params: {
      pid: 'pid',
      cid: 'cid',
    }
  };

  it('When sent a request for matching products by category', async () => {
    productModel.mockResolvesToOnce(products);

    await controllers.realtedProductController(req, res);

    expect(res.send).toHaveBeenCalledWith({
      success: true,
      products,
    });
    expect(res.status).toHaveBeenCalledWith(200);

    expect(productModel.find).toHaveBeenCalledWith({
      category: req.params.cid,
      _id: { $ne: req.params.pid },
    })
  });

  it('When encountering error while searching product', async () => {
    const error = { message: 'error in then()' }
    productModel.mockRejectsWithOnce(error);

    await controllers.realtedProductController(req, res);

    
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: "error while geting related product",
      error,
    });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it.skip.each([
    {params: { cid: req.params.cid }},
    {params: { pid: req.params.pid }},
    {params: { }},
  ])('When receiving params $params', async (req) => {
    await controllers.realtedProductController(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

})
describe('Given productCategoryController', () => {
  const category = {
    _id: "66db427fdb0119d9234b27ef",
    name: "Book",
    slug: "book",
  }
  const products = SAMPLE_PRODUCTS.map(({photo, category: _, ...prod}) => ({...prod, category}));
  
  const req = {
    params: {
      slug: 'book'
    }
  };

  it('When sent a request for products by category', async () => {
    categoryModel.mockResolvesToOnce(category);
    productModel.mockResolvesToOnce(products);

    await controllers.productCategoryController(req, res);

    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category,
      products,
    });
    expect(res.status).toHaveBeenCalledWith(200);

  });

  it('When encountering error while finding products', async () => {
    const error = { message: 'error in productModel.then()' }
    categoryModel.mockResolvesToOnce(category);
    productModel.mockRejectsWithOnce(error);

    await controllers.productCategoryController(req, res);
    
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error,
      message: "Error While Getting products",
    });
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('When encountering error while finding products', async () => {
    const error = { message: 'error in categoryModel.then()' }
    categoryModel.mockRejectsWithOnce(error);

    await controllers.productCategoryController(req, res);
    
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      error,
      message: "Error While Getting products",
    });
    expect(res.status).toHaveBeenCalledWith(400);
  });

})

describe.skip('productModel Mock', () => {
  it('can call methods of productModel', async () => {
    productModel.findOne().select().populate();
    return;
  })
  it('can create new product', async () => {
    productModel.mockReturnValueOnce({lol: 'lol'});
    const doc = productModel({});
    console.log(doc.lol);
  })
})