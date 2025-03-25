Step 1: Create a Vector Search Index (you can also create the index in the atlas gui)
This index includes: Vector Search (plot_embedding) using Euclidean distance
Filters (genres, year) for refining search results
```
from pymongo import MongoClient

# Connect to MongoDB Atlas
client = MongoClient("mongodb+srv://<your-cluster-url>")

# Select Database and Collection
db = client["benefits_db"]
collection = db["documents"]

# Create a New Vector Search Index
vector_index = {
    "name": "vector_search_index",
    "definition": {
        "fields": [
            {
                "numDimensions": 1536,  # Match with embedding model (e.g., OpenAI Ada-002)
                "path": "plot_embedding",  # Vector field in MongoDB
                "similarity": "euclidean",  # Options: "euclidean", "cosine", "dotProduct"
                "type": "vector"
            },
            {
                "path": "genres",  # Optional categorical filter
                "type": "filter"
            },
            {
                "path": "year",  # Optional numeric filter
                "type": "filter"
            }
        ]
    }
}
```
# Create the index
```
db.command("createSearchIndexes", collection.name, indexes=[vector_index])
print("✅ Vector Search Index Created Successfully!")
```
🔹 Now MongoDB Vector Search is properly configured using the new vector type.

📌 Step 2: Insert Documents with Vector Embeddings
This stores:

Embeddings in the plot_embedding field
Metadata fields (genres, year) for filtering
```
import openai

# OpenAI API Key
openai.api_key = "your-openai-api-key"

def generate_embedding(text):
    """Generate vector embeddings using OpenAI"""
    response = openai.Embedding.create(input=text, model="text-embedding-ada-002")
    return response["data"][0]["embedding"]

# Sample document
document_text = "This is a summary of the new insurance policy covering health benefits."
embedding_vector = generate_embedding(document_text)

# Insert into MongoDB
collection.insert_one({
    "text": document_text,
    "plot_embedding": embedding_vector,  # Updated field name
    "genres": ["Healthcare", "Insurance"],  # Categorical filter
    "year": 2024  # Numeric filter
})

print("✅ Document Inserted with Vector Embedding!")
🔹 This ensures that text + metadata filters are stored correctly.
```
📌 Step 3: Run Hybrid Vector Search with Filters
Searches by vector similarity using the new index structure.
Filters by policy (Healthcare) and year (>= 2023).
```
def search_documents(user_query):
    """Perform vector search with metadata filtering on benefit documents"""
    user_embedding = generate_embedding(user_query)

    results = collection.aggregate([
        {
            "$vectorSearch": {
                "queryVector": user_embedding,
                "path": "plot_embedding",
                "numCandidates": 50,  # Fetch more candidates before filtering
                "limit": 5  # Return top 5
            }
        },
        {
            "$match": {
                "document_type": {"$in": ["policy", "coverage_details"]},  # Only relevant doc types
                "plan_tier": {"$in": ["Gold", "Silver"]},  # Prioritize higher-tier plans
                "effective_date": {"$gte": "2023-01-01"}  # Only show active policies
            }
        }
    ])

    return list(results)
```
# Example Query
```
query = "Does my Silver plan cover mental health services?"
matching_docs = search_documents(query)

for doc in matching_docs:
    print(f"🔹 Found Document: {doc['text']}")

```
# Example Query
```
query = "What are the benefits of this healthcare policy?"
matching_docs = search_documents(query)

for doc in matching_docs:
    print(f"🔹 Found Document: {doc['text']}")
```
🔹 This method optimizes results by applying both vector search + metadata filtering.

📌 Step 4: Use Vector Search for a Chatbot (Full RAG Pipeline)
After retrieving documents, we send them to an LLM to refine responses.
```
def generate_answer(user_query):
    """Retrieve documents and generate an answer using OpenAI GPT-4"""
    retrieved_docs = search_documents(user_query)

    if not retrieved_docs:
        return "No relevant documents found."

    context = "\n\n".join(doc["text"] for doc in retrieved_docs)

    response = openai.ChatCompletion.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": "You are an AI assistant helping users understand documents."},
            {"role": "user", "content": f"Refer to this document:\n\n {context} \n\n Answer the question: {user_query}"}
        ]
    )

    return response["choices"][0]["message"]["content"]
```
# Example Chatbot Query
```
user_input = "Does the insurance cover dental benefits?"
response = generate_answer(user_input)

print(f"🤖 AI Response: {response}")
🔹 Now we have a chatbot that leverages MongoDB’s vector search correctly!
```
