from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class Data(BaseModel):
    name_: str = Field(description="asdgj if No data found , show None")