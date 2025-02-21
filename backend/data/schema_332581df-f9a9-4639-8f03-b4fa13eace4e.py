from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class Data(BaseModel):
    Name: str = Field(description="name of the person if No data found , show None")