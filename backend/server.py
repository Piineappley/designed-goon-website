from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()


# === Models ===
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # t-shirt, hoodie, mug
    base_price: float
    image_url: str
    description: str


class Design(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    product_id: str
    design_data: dict  # Contains canvas elements, text, images, positions
    thumbnail: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DesignCreate(BaseModel):
    product_id: str
    design_data: dict
    thumbnail: Optional[str] = None


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    design_id: str
    product_id: str
    quantity: int
    total_price: float
    status: str = "pending"  # pending, completed, cancelled
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    design_id: str
    product_id: str
    quantity: int = 1


# === Utility Functions ===
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        
        # Convert ISO string timestamp back to datetime
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Could not validate credentials")


# === Auth Routes ===
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        name=user_data.name
    )
    
    user_doc = user.model_dump()
    user_doc['password'] = hash_password(user_data.password)
    user_doc['created_at'] = user_doc['created_at'].isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Convert ISO string timestamp back to datetime
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    user_obj = User(**{k: v for k, v in user.items() if k != 'password'})
    access_token = create_access_token(data={"sub": user_obj.id})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_obj
    )


@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# === Product Routes ===
@api_router.get("/products", response_model=List[Product])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    return products


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# === Design Routes ===
@api_router.post("/designs", response_model=Design)
async def create_design(
    design_data: DesignCreate,
    current_user: User = Depends(get_current_user)
):
    design = Design(
        user_id=current_user.id,
        product_id=design_data.product_id,
        design_data=design_data.design_data,
        thumbnail=design_data.thumbnail
    )
    
    design_doc = design.model_dump()
    design_doc['created_at'] = design_doc['created_at'].isoformat()
    design_doc['updated_at'] = design_doc['updated_at'].isoformat()
    
    await db.designs.insert_one(design_doc)
    return design


@api_router.get("/designs", response_model=List[Design])
async def get_user_designs(current_user: User = Depends(get_current_user)):
    designs = await db.designs.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(100)
    
    for design in designs:
        if isinstance(design.get('created_at'), str):
            design['created_at'] = datetime.fromisoformat(design['created_at'])
        if isinstance(design.get('updated_at'), str):
            design['updated_at'] = datetime.fromisoformat(design['updated_at'])
    
    return designs


@api_router.get("/designs/{design_id}", response_model=Design)
async def get_design(
    design_id: str,
    current_user: User = Depends(get_current_user)
):
    design = await db.designs.find_one(
        {"id": design_id, "user_id": current_user.id},
        {"_id": 0}
    )
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    if isinstance(design.get('created_at'), str):
        design['created_at'] = datetime.fromisoformat(design['created_at'])
    if isinstance(design.get('updated_at'), str):
        design['updated_at'] = datetime.fromisoformat(design['updated_at'])
    
    return design


@api_router.put("/designs/{design_id}", response_model=Design)
async def update_design(
    design_id: str,
    design_data: DesignCreate,
    current_user: User = Depends(get_current_user)
):
    existing_design = await db.designs.find_one(
        {"id": design_id, "user_id": current_user.id}
    )
    if not existing_design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    update_data = {
        "product_id": design_data.product_id,
        "design_data": design_data.design_data,
        "thumbnail": design_data.thumbnail,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.designs.update_one(
        {"id": design_id},
        {"$set": update_data}
    )
    
    updated_design = await db.designs.find_one({"id": design_id}, {"_id": 0})
    if isinstance(updated_design.get('created_at'), str):
        updated_design['created_at'] = datetime.fromisoformat(updated_design['created_at'])
    if isinstance(updated_design.get('updated_at'), str):
        updated_design['updated_at'] = datetime.fromisoformat(updated_design['updated_at'])
    
    return Design(**updated_design)


@api_router.delete("/designs/{design_id}")
async def delete_design(
    design_id: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.designs.delete_one(
        {"id": design_id, "user_id": current_user.id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Design not found")
    return {"message": "Design deleted successfully"}


# === Order Routes ===
@api_router.post("/orders", response_model=Order)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user)
):
    # Verify design exists and belongs to user
    design = await db.designs.find_one(
        {"id": order_data.design_id, "user_id": current_user.id}
    )
    if not design:
        raise HTTPException(status_code=404, detail="Design not found")
    
    # Get product price
    product = await db.products.find_one({"id": order_data.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    total_price = product['base_price'] * order_data.quantity
    
    order = Order(
        user_id=current_user.id,
        design_id=order_data.design_id,
        product_id=order_data.product_id,
        quantity=order_data.quantity,
        total_price=total_price,
        status="completed"  # Mock checkout, instantly complete
    )
    
    order_doc = order.model_dump()
    order_doc['created_at'] = order_doc['created_at'].isoformat()
    
    await db.orders.insert_one(order_doc)
    return order


@api_router.get("/orders", response_model=List[Order])
async def get_user_orders(current_user: User = Depends(get_current_user)):
    orders = await db.orders.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).to_list(100)
    
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    
    return orders


# === Initialize Products (seed data) ===
@api_router.post("/seed-products")
async def seed_products():
    # Check if products already exist
    count = await db.products.count_documents({})
    if count > 0:
        return {"message": "Products already seeded"}
    
    products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Classic White T-Shirt",
            "category": "t-shirt",
            "base_price": 24.99,
            "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500",
            "description": "Premium cotton t-shirt perfect for custom designs"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Black T-Shirt",
            "category": "t-shirt",
            "base_price": 24.99,
            "image_url": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500",
            "description": "Sleek black t-shirt for bold designs"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Comfort Hoodie",
            "category": "hoodie",
            "base_price": 49.99,
            "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
            "description": "Cozy hoodie with space for your creativity"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Gray Hoodie",
            "category": "hoodie",
            "base_price": 49.99,
            "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
            "description": "Comfortable gray hoodie for custom prints"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "White Ceramic Mug",
            "category": "mug",
            "base_price": 14.99,
            "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500",
            "description": "Classic ceramic mug for personalized designs"
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Color Changing Mug",
            "category": "mug",
            "base_price": 19.99,
            "image_url": "https://images.unsplash.com/photo-1578679443746-c0fef80a6f6b?w=500",
            "description": "Magic mug that reveals your design with heat"
        }
    ]
    
    await db.products.insert_many(products)
    return {"message": f"Seeded {len(products)} products"}


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    # Seed products on startup
    count = await db.products.count_documents({})
    if count == 0:
        await seed_products()
        logger.info("Products seeded successfully")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
