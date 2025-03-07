user_query_embedding = openai.Embedding.create(
    input="What are the benefits of this policy?",
    model="text-embedding-ada-002"
)
