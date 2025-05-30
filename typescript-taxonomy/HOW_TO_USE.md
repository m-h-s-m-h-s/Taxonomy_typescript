# 🚀 HOW TO USE THE TAXONOMY NAVIGATOR - SUPER SIMPLE GUIDE

This guide will walk you through EVERYTHING you need to know to use the Taxonomy Navigator. No prior experience needed!

## 📋 What This Program Does

The Taxonomy Navigator takes any product description and automatically categorizes it into one of Google's 5,597 product categories. For example:
- "iPhone 14 Pro" → `Electronics > Communications > Telephony > Mobile Phones`
- "Nike running shoes" → `Apparel & Accessories > Shoes`
- "Dog food for puppies" → `Animals & Pet Supplies > Pet Supplies > Dog Supplies > Dog Food`

## 🛠️ STEP 1: Initial Setup (One-Time Only)

### Prerequisites
- Node.js installed (version 14 or higher)
- Your OpenAI API key (which you already provided: ✅)

### Installation Steps

1. **Open Terminal** and navigate to the project:
```bash
cd /Users/mhs/Documents/GitHub/Taxonomy_typescript/typescript-taxonomy
```

2. **Install dependencies**:
```bash
npm install
```

3. **Build the TypeScript code**:
```bash
npm run build
```

That's it! Setup is complete. ✅

## 🎮 STEP 2: How to Use Each Feature

### Option A: Interactive Mode (Easiest Way to Start!)

This is the BEST way to understand how the system works.

**How to run:**
```bash
npm run interactive
```

**What happens:**
1. The program will prompt: `Enter product to classify (or 'quit' to exit):`
2. Type any product description, for example: `Samsung 65 inch smart TV`
3. Press Enter
4. Watch as the AI classifies your product step-by-step!
5. You'll see the final category and full path
6. It will ask for another product (type 'quit' to exit)

**Example session:**
```
🚀 Welcome to Taxonomy Navigator Interactive Interface!
📊 Loaded 5597 taxonomy categories

Enter product to classify (or 'quit' to exit): iPhone 14 Pro

🔍 Classifying: iPhone 14 Pro

✅ Classification Results:
   Category: Mobile Phones
   Full Path: Electronics > Communications > Telephony > Mobile Phones
   
⏱️  Processing time: 4.2 seconds
📊 API calls made: 5

Enter product to classify (or 'quit' to exit): quit
👋 Thank you for using Taxonomy Navigator!
```

### Option B: Batch Test Mode (See the Magic Behind the Scenes!)

This mode shows you EXACTLY how the AI narrows down from 5,597 categories to 1.

**How to run:**
```bash
npm run batch-test
```

**What happens:**
1. It will ask: `Enter number of products to test:`
2. Type a small number like `3` and press Enter
3. Watch the detailed 5-stage classification process for each product!

**What you'll see:**
```
Enter number of products to test: 2

Testing 2 random products from sample file...

==================================================
Product 1/2: iPhone 14 Pro: Latest Apple smartphone with A16 chip
==================================================

📝 STAGE 0 - AI Summary:
"Smartphone (mobile phone, cell phone). Mobile device for communication..."

🎯 STAGE 1 - Selecting 2 main categories from 21:
Selected: Electronics, Software

🔍 STAGE 2A - Searching in Electronics (339 categories):
Processing batch 1/4 (categories 1-100)...
Selected: Mobile Phones, Mobile Phone Accessories...

🎯 STAGE 3 - Final Selection:
Best match: Mobile Phones
Full path: Electronics > Communications > Telephony > Mobile Phones

✅ CLASSIFICATION COMPLETE
```

### Option C: Classify a Single Product (Quick One-Off)

**How to run:**
```bash
npm run classify -- "Your product description here"
```

**Example:**
```bash
npm run classify -- "Nike Air Max running shoes"
```

**Output:**
```
Classifying: Nike Air Max running shoes
Processing...

Category: Shoe
Full Path: Apparel & Accessories > Shoes
API Calls: 6
Time: 3842ms
```

### Option D: Analyze Multiple Products from a File

**How to run:**
```bash
npm run analyze-batch
```

This will:
1. Read products from `tests/sample_products.txt`
2. Classify each one
3. Save results to a JSON file
4. Show statistics

## 📊 Understanding the Output

Each classification result shows:

1. **Category**: The specific product category (e.g., "Mobile Phones")
2. **Full Path**: Complete hierarchy (e.g., "Electronics > Communications > Telephony > Mobile Phones")
3. **API Calls**: Number of AI requests made (usually 3-20)
4. **Time**: Processing time in milliseconds

## 🔧 Troubleshooting

### "Cannot find module" error
**Solution**: Run `npm run build` first

### "API key not found" error
**Solution**: Your API key is already set up! But if needed, check that `typescript-taxonomy/data/api_key.txt` exists

### "Rate limit" error
**Solution**: Wait a minute and try again (OpenAI limits requests per minute)

### Program seems stuck
**Solution**: Each classification takes 3-7 seconds. Be patient!

## 💡 Pro Tips

1. **Start with Interactive Mode** - It's the easiest way to understand the system
2. **Try Batch Test Mode with 1-3 products** - See the AI's decision process
3. **Use specific product descriptions** - "iPhone 14 Pro" works better than just "phone"
4. **The more detail, the better** - "Samsung 65-inch QLED Smart TV" is better than "TV"

## 🎯 Quick Command Reference

```bash
# Interactive mode (recommended for beginners)
npm run interactive

# Batch test with visualization (see how it works)
npm run batch-test

# Classify one product
npm run classify -- "product description"

# Analyze multiple products
npm run analyze-batch

# Run example code
npm start
```

## 📝 Example Products to Try

Copy and paste these into interactive mode:

- `iPhone 14 Pro with 256GB storage and triple camera system`
- `Nike Air Jordan basketball shoes size 10`
- `Instant Pot 8 quart pressure cooker`
- `LEGO Star Wars Millennium Falcon building set`
- `Pampers baby diapers size 3`
- `Samsung 65 inch QLED 4K Smart TV`
- `Blue Buffalo dog food for senior dogs`
- `Yoga mat 6mm thick non-slip exercise mat`
- `KitchenAid stand mixer 5 quart`
- `Harry Potter complete book collection hardcover`

## 🚨 IMPORTANT: Your API Key is Already Set Up!

Your OpenAI API key is saved in `typescript-taxonomy/data/api_key.txt`. You don't need to do anything else for authentication!

## 🎉 That's It!

You're ready to classify products! Start with `npm run interactive` and have fun exploring how AI categorizes different products.

Remember: Each classification costs about $0.001-0.002, so feel free to experiment! 