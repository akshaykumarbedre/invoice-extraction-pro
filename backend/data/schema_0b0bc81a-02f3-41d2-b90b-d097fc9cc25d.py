from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class Data(BaseModel):
    name: str = Field(description="name of the person")