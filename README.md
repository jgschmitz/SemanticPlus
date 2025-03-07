Step 1: Ingesting Documents
Extract text & tables from PDFs, Word, and PPTs.

Generate embeddings for each document using Voyage AI (built into MongoDB Atlas) or OpenAI embeddings.

Store extracted text + embeddings in MongoDB Atlas.

Example MongoDB Schema:
```
{
  "document_id": "doc123",
  "title": "Policy Guidelines",
  "text": "Full extracted text from the document...",
  "vector": [0.23, -0.67, 0.89, ...],  // Embedding for semantic search
  "metadata": { "category": "Finance", "date": "2024-03-01" }
}
```
Step 2: Running a Hybrid Search When User Asks a Question
💡 MongoDB Atlas Search supports hybrid search, so we can combine keyword search with vector similarity search.

Step 2.1: Convert User Question into an Embedding
```
user_query_embedding = openai.Embedding.create(
    input="What are the benefits of this policy?",
    model="text-embedding-ada-002"
)
```
Step 2.2: Search MongoDB for the Most Relevant Documents
```
db.documents.aggregate([
  {
    "$vectorSearch": {
      "queryVector": user_query_embedding,
      "path": "vector",
      "numCandidates": 10,
      "limit": 5
    }
  }
])
```
✅ Returns the most relevant documents based on semantic similarity.
✅ Fast performance (<100ms) even on large datasets.

Step 3: Answer Extraction Using an LLM
The chatbot takes the top document(s) retrieved by MongoDB and sends them to an LLM (like OpenAI GPT-4, Gemini, or a local model).

The LLM extracts the correct answer and returns it to the user.

Example Query to OpenAI for Answer Extraction:
```
response = openai.ChatCompletion.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are an expert document assistant."},
        {"role": "user", "content": f"Refer to this document:\n\n {retrieved_doc_text} \n\n Answer the question: {user_query}"}
    ]
)
```
