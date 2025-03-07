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
